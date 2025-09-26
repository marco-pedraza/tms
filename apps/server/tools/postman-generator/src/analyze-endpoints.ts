#!/usr/bin/env tsx
import * as path from 'path';
import * as ts from 'typescript';
import { safeExistsSync, safeReadFileSync } from './fs-utils';

/**
 * Metadata about a parameter property
 */
export interface PropertyMetadata {
  name: string;
  type: string;
  isOptional: boolean;
  defaultValue: unknown;
}

/**
 * Represents an API endpoint extracted from a controller file
 */
export interface EndpointInfo {
  /** Name of the exported function */
  name: string;
  /** HTTP method (GET, POST, PUT, DELETE) */
  method: string;
  /** API path with potential variables */
  path: string;
  /** Whether the endpoint is publicly exposed */
  expose: boolean;
  /** Whether authentication is required */
  requiresAuth: boolean;
  /** JSDoc description if available */
  description?: string;
  /** Path variables extracted from the path (e.g., ['id'] from '/countries/:id') */
  pathVariables: string[];
  /** Parameter type name if available */
  parameterType?: string;
  /** Return type name if available */
  returnType?: string;
  /** JSDoc parameters information */
  jsdocParams?: {
    name: string;
    description: string;
    type?: string;
  }[];
  /** JSDoc throws information */
  jsdocThrows?: string[];
  /** Generated example body/query parameters */
  exampleParams?: unknown;
  /** Metadata about parameter properties (optional/required, types, etc.) */
  parameterMetadata?: PropertyMetadata[];
}

/**
 * Result of analyzing a controller file
 */
interface AnalysisResult {
  /** File path that was analyzed */
  filePath: string;
  /** List of endpoints found in the file */
  endpoints: EndpointInfo[];
  /** Any errors encountered during analysis */
  errors: string[];
}

/**
 * Type information extracted from TypeScript interfaces
 */
interface TypeInfo {
  name: string;
  properties: PropertyInfo[];
}

/**
 * Property information from TypeScript interfaces
 */
interface PropertyInfo {
  name: string;
  type: string;
  optional: boolean;
  isArray: boolean;
  enumValues?: string[];
  nestedType?: TypeInfo;
}

/**
 * Extracts path variables from an API path
 * @param apiPath - The API path (e.g., '/countries/:id/update')
 * @returns Array of variable names (e.g., ['id'])
 */
function extractPathVariables(apiPath: string): string[] {
  const matches = apiPath.match(/:(\w+)/g);
  return matches ? matches.map((match) => match.substring(1)) : [];
}

/**
 * Generates default values based on TypeScript types
 */
function getDefaultValueForType(type: string): unknown {
  // Remove optional markers and whitespace
  const cleanType = type.replace(/\s*\|\s*undefined/g, '').trim();

  // Handle union types with null
  if (cleanType.includes('| null')) {
    return null;
  }

  // Handle string types
  if (cleanType.includes('string')) {
    if (cleanType.includes('Date')) {
      return '2009-11-10T23:00:00Z';
    }
    return '';
  }

  // Handle number types
  if (cleanType.includes('number')) {
    return 0.0;
  }

  // Handle boolean types
  if (cleanType.includes('boolean')) {
    return false;
  }

  // Handle Date types
  if (cleanType.includes('Date')) {
    return '2009-11-10T23:00:00Z';
  }

  // Handle array types
  if (cleanType.includes('[]') || cleanType.includes('Array<')) {
    return [];
  }

  // Handle object types
  if (cleanType.includes('{') || cleanType === 'object') {
    return {};
  }

  // Default fallback
  return null;
}

/**
 * Extracts metadata about properties from a TypeScript type
 */
function extractPropertyMetadata(
  typeNode: ts.TypeNode | undefined,
  sourceFile: ts.SourceFile,
  typesFile?: ts.SourceFile,
): PropertyMetadata[] {
  if (!typeNode) return [];

  const metadata: PropertyMetadata[] = [];

  // Handle type literal nodes (inline object types)
  if (ts.isTypeLiteralNode(typeNode)) {
    for (const member of typeNode.members) {
      if (ts.isPropertySignature(member) && member.name) {
        const propName = member.name.getText();
        const isOptional = !!member.questionToken;
        const propType = member.type ? member.type.getText() : 'any';
        const defaultValue = member.type
          ? analyzeTypeStructure(member.type, sourceFile, typesFile)
          : getDefaultValueForType('any');

        metadata.push({
          name: propName,
          type: propType,
          isOptional,
          defaultValue,
        });
      }
    }
  }

  // Handle type references (interfaces, type aliases)
  if (ts.isTypeReferenceNode(typeNode)) {
    const typeName = typeNode.typeName.getText();
    const typeDefinition = findTypeDefinition(typeName, sourceFile, typesFile);

    if (typeDefinition) {
      return extractPropertyMetadata(typeDefinition, sourceFile, typesFile);
    }
  }

  return metadata;
}

/**
 * Generates parameter metadata for an endpoint based on its parameter type
 */
function generateParameterMetadata(
  parameterType: string | undefined,
  sourceFile: ts.SourceFile,
  typesFile?: ts.SourceFile,
): PropertyMetadata[] {
  if (!parameterType) return [];

  // Handle intersection types (e.g., "UpdateCountryPayload & { id: number }")
  if (parameterType.includes('&')) {
    return parseIntersectionMetadata(parameterType, sourceFile, typesFile);
  }

  // Handle inline object types (e.g., "{ id: number; events: Type['prop'] }")
  if (parameterType.includes('{') && parameterType.includes('}')) {
    return parseInlineObjectMetadata(parameterType, sourceFile, typesFile);
  }

  // Try to find and analyze the type definition
  const cleanTypeName = parameterType.replace(/Promise<|>/g, '').trim();

  const typeDefinition = findTypeDefinition(
    cleanTypeName,
    sourceFile,
    typesFile,
  );

  if (typeDefinition) {
    return extractPropertyMetadata(typeDefinition, sourceFile, typesFile);
  }

  return [];
}

/**
 * Parses intersection types for metadata extraction
 */
function parseIntersectionMetadata(
  parameterType: string,
  sourceFile: ts.SourceFile,
  typesFile?: ts.SourceFile,
): PropertyMetadata[] {
  const metadata: PropertyMetadata[] = [];
  const parts = parameterType.split('&').map((part) => part.trim());

  for (const part of parts) {
    if (part.includes('{') && part.includes('}')) {
      // Handle inline object type
      const inlineMetadata = parseInlineObjectMetadata(
        part,
        sourceFile,
        typesFile,
      );
      metadata.push(...inlineMetadata);
    } else {
      // Handle named type
      const cleanPart = part.replace(/\s+/g, ' ').trim();
      const typeDefinition = findTypeDefinition(
        cleanPart,
        sourceFile,
        typesFile,
      );
      if (typeDefinition) {
        const typeMetadata = extractPropertyMetadata(
          typeDefinition,
          sourceFile,
          typesFile,
        );
        metadata.push(...typeMetadata);
      }
    }
  }

  return metadata;
}

/**
 * Extracts content between balanced braces, handling nested objects
 */
function extractBalancedBraces(typeString: string): string | null {
  const start = typeString.indexOf('{');
  if (start === -1) return null;

  let depth = 0;
  let inString = false;
  let stringChar = '';
  let end = -1;

  for (let i = start; i < typeString.length; i++) {
    const char = typeString[i];
    const prevChar = i > 0 ? typeString[i - 1] : '';

    // Handle string literals (skip braces inside strings)
    if (!inString && (char === '"' || char === "'")) {
      inString = true;
      stringChar = char;
    } else if (inString && char === stringChar && prevChar !== '\\') {
      inString = false;
      stringChar = '';
    }

    // Track brace depth only when not in string
    if (!inString) {
      if (char === '{') {
        depth++;
      } else if (char === '}') {
        depth--;
        if (depth === 0) {
          end = i;
          break;
        }
      }
    }
  }

  if (end === -1) return null;
  return typeString.slice(start + 1, end);
}

/**
 * Parses inline object types for metadata extraction
 */
function parseInlineObjectMetadata(
  typeString: string,
  sourceFile: ts.SourceFile,
  typesFile?: ts.SourceFile,
): PropertyMetadata[] {
  const metadata: PropertyMetadata[] = [];

  // Extract content between balanced braces
  const content = extractBalancedBraces(typeString);
  if (!content) return metadata;
  const properties = splitTypeProperties(content);

  for (const prop of properties) {
    const colonIndex = prop.indexOf(':');
    if (colonIndex === -1) continue;

    const key = prop.substring(0, colonIndex).trim();
    const type = prop.substring(colonIndex + 1).trim();

    // Check if property is optional (ends with ?)
    const isOptional = key.endsWith('?');
    const propName = isOptional ? key.slice(0, -1).trim() : key;

    let defaultValue: unknown;

    // Handle property access types like "Type['property']"
    if (type.includes('[') && type.includes(']')) {
      defaultValue = resolvePropertyAccessType(type, sourceFile, typesFile);
    } else {
      defaultValue = getDefaultValueForType(type);
    }

    metadata.push({
      name: propName,
      type,
      isOptional,
      defaultValue,
    });
  }

  return metadata;
}

/**
 * Checks if a TypeScript type node represents null or undefined
 */
function isNullOrUndefinedType(typeNode: ts.TypeNode): boolean {
  // Check for direct undefined/null keywords
  if (
    typeNode.kind === ts.SyntaxKind.UndefinedKeyword ||
    typeNode.kind === ts.SyntaxKind.NullKeyword
  ) {
    return true;
  }

  // Check for literal type nodes with undefined/null keywords
  if (ts.isLiteralTypeNode(typeNode)) {
    return (
      typeNode.literal.kind === ts.SyntaxKind.UndefinedKeyword ||
      typeNode.literal.kind === ts.SyntaxKind.NullKeyword
    );
  }

  return false;
}

/**
 * Analyzes TypeScript type and extracts structure information
 */
function analyzeTypeStructure(
  typeNode: ts.TypeNode | undefined,
  sourceFile: ts.SourceFile,
  typesFile?: ts.SourceFile,
): unknown {
  if (!typeNode) return null;

  // Handle different type node kinds
  if (ts.isTypeLiteralNode(typeNode)) {
    const obj: Record<string, unknown> = {};

    for (const member of typeNode.members) {
      if (ts.isPropertySignature(member) && member.name) {
        const propName = member.name.getText();

        if (member.type) {
          const propValue = analyzeTypeStructure(
            member.type,
            sourceFile,
            typesFile,
          );

          // Include all properties (both required and optional) in the example
          obj[propName] = propValue;
        } else {
          const defaultValue = getDefaultValueForType('any');
          obj[propName] = defaultValue;
        }
      }
    }

    return obj;
  }

  // Handle type references (interfaces, type aliases)
  if (ts.isTypeReferenceNode(typeNode)) {
    const typeName = typeNode.typeName.getText();

    // Handle generic types
    if (typeNode.typeArguments && typeNode.typeArguments.length > 0) {
      const firstArg = typeNode.typeArguments[0];

      // Handle common generic patterns
      if (typeName === 'Promise') {
        return analyzeTypeStructure(firstArg, sourceFile, typesFile);
      }

      if (typeName === 'Array') {
        return [analyzeTypeStructure(firstArg, sourceFile, typesFile)];
      }
    }

    // Try to find the interface/type definition in the same file or imports
    const typeDefinition = findTypeDefinition(typeName, sourceFile, typesFile);
    if (typeDefinition) {
      return analyzeTypeStructure(typeDefinition, sourceFile, typesFile);
    }

    // Fallback to default value based on type name
    return getDefaultValueForType(typeName);
  }

  // Handle union types
  if (ts.isUnionTypeNode(typeNode)) {
    // Find the first type that is not null or undefined
    let firstNonNullUndefined: ts.TypeNode | undefined;

    for (const unionType of typeNode.types) {
      // Skip undefined and null types
      if (isNullOrUndefinedType(unionType)) {
        continue;
      }

      // Found a non-null/undefined type
      firstNonNullUndefined = unionType;
      break;
    }

    // Use the first non-null/undefined type, or fallback to first member if all are null/undefined
    const typeToAnalyze = firstNonNullUndefined ?? typeNode.types[0];
    return analyzeTypeStructure(typeToAnalyze, sourceFile, typesFile);
  }

  // Handle array types
  if (ts.isArrayTypeNode(typeNode)) {
    const elementType = analyzeTypeStructure(
      typeNode.elementType,
      sourceFile,
      typesFile,
    );
    return [elementType];
  }

  // Handle literal types
  if (ts.isLiteralTypeNode(typeNode)) {
    if (ts.isStringLiteral(typeNode.literal)) {
      return typeNode.literal.text;
    }
    if (ts.isNumericLiteral(typeNode.literal)) {
      return parseFloat(typeNode.literal.text);
    }
    if (typeNode.literal.kind === ts.SyntaxKind.TrueKeyword) {
      return true;
    }
    if (typeNode.literal.kind === ts.SyntaxKind.FalseKeyword) {
      return false;
    }
  }

  // Handle basic types
  const typeText = typeNode.getText();
  return getDefaultValueForType(typeText);
}

/**
 * Finds type definition in the source file or types file
 */
function findTypeDefinition(
  typeName: string,
  sourceFile: ts.SourceFile,
  typesFile?: ts.SourceFile,
): ts.TypeNode | undefined {
  let foundType: ts.TypeNode | undefined;

  function visit(node: ts.Node) {
    // Look for interface declarations
    if (ts.isInterfaceDeclaration(node) && node.name.text === typeName) {
      // Convert interface to type literal for processing
      const members: ts.TypeElement[] = [];
      node.members.forEach((member) => members.push(member));

      foundType = ts.factory.createTypeLiteralNode(members);
      return;
    }

    // Look for type alias declarations
    if (ts.isTypeAliasDeclaration(node) && node.name.text === typeName) {
      foundType = node.type;
      return;
    }

    ts.forEachChild(node, visit);
  }

  // First search in the types file if available
  if (typesFile) {
    visit(typesFile);
  }

  // If not found, search in the main source file
  if (!foundType) {
    visit(sourceFile);
  }

  return foundType;
}

/**
 * Generates example parameters for an endpoint based on its parameter type
 */
function generateExampleParams(
  parameterType: string | undefined,
  sourceFile: ts.SourceFile,
  method: string,
  typesFile?: ts.SourceFile,
): unknown {
  if (!parameterType) return null;

  // For GET requests with simple types, generate query params
  if (method === 'GET' && parameterType.includes('{ id: number }')) {
    return { id: 1 };
  }

  // Handle intersection types FIRST (e.g., "UpdateCountryPayload & { id: number }")
  if (parameterType.includes('&')) {
    return parseIntersectionType(parameterType, sourceFile, typesFile);
  }

  // Handle inline object types (e.g., "{ id: number; events: Type['prop'] }")
  if (parameterType.includes('{') && parameterType.includes('}')) {
    return parseInlineObjectType(parameterType, sourceFile, typesFile);
  }

  // Try to find and analyze the type definition
  const cleanTypeName = parameterType.replace(/Promise<|>/g, '').trim();

  // Handle specific known patterns for list/paginated query params
  if (cleanTypeName.includes('QueryParams')) {
    return generateListQueryExample(cleanTypeName, sourceFile, typesFile);
  }

  const typeDefinition = findTypeDefinition(
    cleanTypeName,
    sourceFile,
    typesFile,
  );
  if (typeDefinition) {
    return analyzeTypeStructure(typeDefinition, sourceFile, typesFile);
  }

  // Fallback to basic type analysis
  return getDefaultValueForType(parameterType);
}

/**
 * Generates example for list/paginated query parameters
 */
function generateListQueryExample(
  typeName: string,
  sourceFile: ts.SourceFile,
  typesFile?: ts.SourceFile,
): Record<string, unknown> {
  // Extract the entity type from the generic (e.g., State from ListStatesQueryParams)
  const entityMatch = typeName.match(/List(\w+)QueryParams/);
  const entityName = entityMatch ? entityMatch[1].replace(/s$/, '') : 'Entity'; // Remove plural 's'

  // Find the entity interface to get its properties
  const entityDefinition = findTypeDefinition(
    entityName,
    sourceFile,
    typesFile,
  );
  let entityProperties: Record<string, unknown> = {};

  if (entityDefinition) {
    const analyzed = analyzeTypeStructure(
      entityDefinition,
      sourceFile,
      typesFile,
    );
    entityProperties =
      analyzed && typeof analyzed === 'object' && analyzed !== null
        ? (analyzed as Record<string, unknown>)
        : {};
  }

  // Get field names for orderBy options
  const fieldNames = Object.keys(entityProperties);
  const primaryField = fieldNames.includes('id') ? 'id' : fieldNames[0] || 'id';

  // Generate base structure
  const baseExample: Record<string, unknown> = {
    orderBy: [
      {
        field: primaryField, // Available fields: ${fieldNames.join(' | ')}
        direction: 'asc', // | 'desc'
      },
    ],
    filters: entityProperties,
    searchTerm: '',
  };

  // Add pagination if it's a paginated query
  if (typeName.includes('Paginated')) {
    baseExample.page = 0;
    baseExample.pageSize = 10;
  }

  return baseExample;
}

/**
 * Parses inline object types like "{ id: number; events: Type['prop'] }"
 */
function parseInlineObjectType(
  typeString: string,
  sourceFile: ts.SourceFile,
  typesFile?: ts.SourceFile,
): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  // Extract content between balanced braces
  const content = extractBalancedBraces(typeString);
  if (!content) return result;

  // Split by semicolon or comma, handling nested structures
  const properties = splitTypeProperties(content);

  for (const prop of properties) {
    const colonIndex = prop.indexOf(':');
    if (colonIndex === -1) continue;

    const key = prop.substring(0, colonIndex).trim();
    const type = prop.substring(colonIndex + 1).trim();

    // Handle property access types like "Type['property']"
    if (type.includes('[') && type.includes(']')) {
      result[key] = resolvePropertyAccessType(type, sourceFile, typesFile);
    } else {
      result[key] = getDefaultValueForType(type);
    }
  }

  return result;
}

/**
 * Splits type properties handling nested structures
 */
function splitTypeProperties(content: string): string[] {
  const properties: string[] = [];
  let current = '';
  let depth = 0;
  let inString = false;
  let stringChar = '';

  for (const char of content) {
    if (!inString && (char === '"' || char === "'")) {
      inString = true;
      stringChar = char;
    } else if (inString && char === stringChar) {
      inString = false;
      stringChar = '';
    } else if (!inString) {
      if (char === '[' || char === '{') {
        depth++;
      } else if (char === ']' || char === '}') {
        depth--;
      } else if ((char === ';' || char === ',') && depth === 0) {
        if (current.trim()) {
          properties.push(current.trim());
        }
        current = '';
        continue;
      }
    }

    current += char;
  }

  if (current.trim()) {
    properties.push(current.trim());
  }

  return properties;
}

/**
 * Resolves property access types like "AssignEventsToNodePayload['events']"
 */
function resolvePropertyAccessType(
  typeString: string,
  sourceFile: ts.SourceFile,
  typesFile?: ts.SourceFile,
): unknown {
  // Extract type name and property
  const match = typeString.match(/(\w+)\['(\w+)'\]/);
  if (!match) {
    return getDefaultValueForType(typeString);
  }

  const [, typeName, propertyName] = match;

  // Find the type definition
  const typeDefinition = findTypeDefinition(typeName, sourceFile, typesFile);
  if (!typeDefinition) {
    return getDefaultValueForType('unknown');
  }

  // Analyze the type structure to get the property
  const typeStructure = analyzeTypeStructure(
    typeDefinition,
    sourceFile,
    typesFile,
  );
  if (
    typeStructure &&
    typeof typeStructure === 'object' &&
    typeStructure !== null &&
    propertyName in typeStructure
  ) {
    return (typeStructure as Record<string, unknown>)[propertyName];
  }

  // Fallback: try to infer from property name
  if (propertyName.toLowerCase().includes('id')) {
    return [0]; // Assume array of IDs
  }
  if (propertyName.toLowerCase().includes('event')) {
    return [{}]; // Assume array of objects
  }

  return [];
}

/**
 * Parses intersection types more robustly
 */
function parseIntersectionType(
  parameterType: string,
  sourceFile: ts.SourceFile,
  typesFile?: ts.SourceFile,
): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  // Split by & and process each part
  const parts = parameterType.split('&').map((part) => part.trim());

  for (const part of parts) {
    if (part.includes('{') && part.includes('}')) {
      // Handle inline object type
      const inlineResult = parseInlineObjectType(part, sourceFile, typesFile);
      Object.assign(result, inlineResult);
    } else {
      // Handle named type - clean up any extra whitespace/newlines
      const cleanPart = part.replace(/\s+/g, ' ').trim();
      const typeDefinition = findTypeDefinition(
        cleanPart,
        sourceFile,
        typesFile,
      );
      if (typeDefinition) {
        const typeResult = analyzeTypeStructure(
          typeDefinition,
          sourceFile,
          typesFile,
        );
        if (typeResult && typeof typeResult === 'object') {
          Object.assign(result, typeResult);
        }
      } else {
        // If we can't find the type definition, try to infer from the name
        // console.warn(`Could not find type definition for: ${cleanPart}`);

        // Try to generate a basic structure based on common patterns
        if (cleanPart.toLowerCase().includes('payload')) {
          // For payload types, try to find similar patterns
          const baseResult = generateFallbackForPayloadType(
            cleanPart,
            sourceFile,
            typesFile,
          );
          if (baseResult && typeof baseResult === 'object') {
            Object.assign(result, baseResult);
          }
        }
      }
    }
  }

  return result;
}

/**
 * Generates fallback structure for payload types when definition is not found
 */
function generateFallbackForPayloadType(
  typeName: string,
  sourceFile: ts.SourceFile,
  typesFile?: ts.SourceFile,
): Record<string, unknown> | null {
  // Try to extract entity name from payload type name
  // e.g., "UpdateNodePayload" -> "Node"
  const entityMatch = typeName.match(/^(Create|Update)(\w+)Payload$/);
  if (!entityMatch) return null;

  const entityName = entityMatch[2];

  // Try to find the base entity type
  const entityDefinition = findTypeDefinition(
    entityName,
    sourceFile,
    typesFile,
  );
  if (entityDefinition) {
    const entityStructure = analyzeTypeStructure(
      entityDefinition,
      sourceFile,
      typesFile,
    );
    if (
      entityStructure &&
      typeof entityStructure === 'object' &&
      entityStructure !== null
    ) {
      // For update payloads, make all fields optional by removing required fields like id, timestamps
      const result = { ...(entityStructure as Record<string, unknown>) };

      // Remove fields that are typically not in update payloads
      delete result.id;
      delete result.createdAt;
      delete result.updatedAt;
      delete result.slug; // Usually auto-generated

      return result;
    }
  }

  return null;
}

/**
 * Extracts JSDoc information from a node
 */
function extractJSDocInfo(node: ts.Node): {
  description?: string;
  params?: { name: string; description: string; type?: string }[];
  throws?: string[];
} {
  const jsDocTags = ts.getJSDocTags(node);
  const jsDocComments = ts.getJSDocCommentsAndTags(node);

  let description: string | undefined;
  const params: { name: string; description: string; type?: string }[] = [];
  const throws: string[] = [];

  // Extract main description
  for (const comment of jsDocComments) {
    if (ts.isJSDoc(comment) && comment.comment) {
      if (typeof comment.comment === 'string') {
        description = comment.comment;
      } else {
        description = comment.comment
          .map((part) => (typeof part === 'string' ? part : part.text))
          .join('');
      }
      break;
    }
  }

  // Extract @param and @throws tags
  for (const tag of jsDocTags) {
    if (ts.isJSDocParameterTag(tag) && tag.name && tag.comment) {
      const paramName = tag.name.getText();
      const paramDesc =
        typeof tag.comment === 'string'
          ? tag.comment
          : tag.comment
              .map((part) => (typeof part === 'string' ? part : part.text))
              .join('');

      params.push({
        name: paramName,
        description: paramDesc,
        type: tag.typeExpression?.type.getText(),
      });
    } else if (ts.isJSDocThrowsTag(tag) && tag.comment) {
      const throwsDesc =
        typeof tag.comment === 'string'
          ? tag.comment
          : tag.comment
              .map((part) => (typeof part === 'string' ? part : part.text))
              .join('');
      throws.push(throwsDesc);
    }
  }

  return { description, params, throws };
}

/**
 * Extracts type information from function parameters and return type
 */
function extractTypeInfo(node: ts.VariableDeclaration): {
  parameterType?: string;
  returnType?: string;
} {
  let parameterType: string | undefined;
  let returnType: string | undefined;

  if (node.initializer && ts.isCallExpression(node.initializer)) {
    // Get the function (second argument of api call)
    const functionArg = node.initializer.arguments[1];

    if (functionArg && ts.isArrowFunction(functionArg)) {
      // Extract parameter type
      if (functionArg.parameters.length > 0) {
        const param = functionArg.parameters[0];
        if (param.type) {
          parameterType = param.type.getText();
        } else if (ts.isObjectBindingPattern(param.name)) {
          // Try to infer from destructuring pattern
          parameterType = inferTypeFromDestructuring(param.name);
        }
      }

      // Extract return type
      if (functionArg.type) {
        returnType = functionArg.type.getText();
      }
    }
  }

  return { parameterType, returnType };
}

/**
 * Attempts to infer type from destructuring pattern
 */
function inferTypeFromDestructuring(
  bindingPattern: ts.ObjectBindingPattern,
): string | undefined {
  // This is a fallback for cases where we can't get the explicit type
  // We'll try to build a basic object type from the destructuring pattern
  const properties: string[] = [];

  for (const element of bindingPattern.elements) {
    if (ts.isBindingElement(element) && ts.isIdentifier(element.name)) {
      const propName = element.name.text;

      // Make educated guesses about types based on common patterns
      if (propName === 'id') {
        properties.push('id: number');
      } else if (propName.endsWith('Id')) {
        properties.push(`${propName}: number`);
      } else if (propName.includes('active') || propName.includes('enabled')) {
        properties.push(`${propName}: boolean`);
      } else {
        properties.push(`${propName}: unknown`);
      }
    } else if (ts.isBindingElement(element) && element.dotDotDotToken) {
      // Handle rest parameters (...data)
      properties.push('...rest: unknown');
    }
  }

  return properties.length > 0 ? `{ ${properties.join(', ')} }` : undefined;
}

/**
 * Visits AST nodes to find API endpoints
 */
function visitNode(
  node: ts.Node,
  sourceFile: ts.SourceFile,
  typesSourceFile: ts.SourceFile | undefined,
  result: AnalysisResult,
): void {
  // Look for variable declarations that use the api function
  if (
    ts.isVariableDeclaration(node) &&
    node.name &&
    ts.isIdentifier(node.name) &&
    node.initializer &&
    ts.isCallExpression(node.initializer) &&
    node.initializer.expression.getText().includes('api')
  ) {
    try {
      const endpoint = extractEndpointFromNode(
        node,
        sourceFile,
        typesSourceFile,
      );
      if (endpoint) {
        result.endpoints.push(endpoint);
      }
    } catch (error) {
      result.errors.push(
        `Error processing endpoint ${node.name.text}: ${error}`,
      );
    }
  }

  // Continue traversing the tree
  ts.forEachChild(node, (childNode) => {
    visitNode(childNode, sourceFile, typesSourceFile, result);
  });
}

/**
 * Analyzes a controller file and extracts endpoint information
 * @param filePath - Path to the controller file to analyze
 * @returns Analysis result with endpoints and any errors
 */
function analyzeControllerFile(filePath: string): AnalysisResult {
  const result: AnalysisResult = {
    filePath,
    endpoints: [],
    errors: [],
  };

  try {
    // Read file content
    if (!safeExistsSync(filePath)) {
      result.errors.push(`File not found: ${filePath}`);
      return result;
    }

    const fileContent = safeReadFileSync(filePath, 'utf-8');

    // Create TypeScript source file
    const sourceFile = ts.createSourceFile(
      path.basename(filePath),
      fileContent,
      ts.ScriptTarget.Latest,
      true,
    );

    // Also try to read the types file in the same directory
    const typesFile = findTypesFile(filePath);
    let typesSourceFile: ts.SourceFile | undefined;

    if (typesFile) {
      if (safeExistsSync(typesFile)) {
        try {
          const typesContent = safeReadFileSync(typesFile, 'utf-8');
          typesSourceFile = ts.createSourceFile(
            path.basename(typesFile),
            typesContent,
            ts.ScriptTarget.Latest,
            true,
          );
        } catch (error) {
          result.errors.push(`Error reading types file ${typesFile}: ${error}`);
        }
      }
    }

    // Start visiting from the root
    visitNode(sourceFile, sourceFile, typesSourceFile, result);
  } catch (error) {
    result.errors.push(`Error analyzing file: ${error}`);
  }

  return result;
}

/**
 * Finds the corresponding types file for a controller file
 */
function findTypesFile(controllerPath: string): string | undefined {
  const dir = path.dirname(controllerPath);
  const baseName = path.basename(controllerPath, '.controller.ts');
  const typesPath = path.join(dir, `${baseName}.types.ts`);

  return safeExistsSync(typesPath) ? typesPath : undefined;
}

/**
 * Extracts endpoint information from a variable declaration node
 */
function extractEndpointFromNode(
  node: ts.VariableDeclaration,
  sourceFile: ts.SourceFile,
  typesSourceFile?: ts.SourceFile,
): EndpointInfo | null {
  if (
    !ts.isIdentifier(node.name) ||
    !node.initializer ||
    !ts.isCallExpression(node.initializer)
  ) {
    return null;
  }

  const functionName = node.name.text;
  const apiConfig = node.initializer.arguments[0];

  if (!apiConfig || !ts.isObjectLiteralExpression(apiConfig)) {
    return null;
  }

  let method = '';
  let path = '';
  let expose = false;
  let requiresAuth = false;

  // Extract API configuration properties
  for (const property of apiConfig.properties) {
    if (ts.isPropertyAssignment(property)) {
      const propertyName = property.name.getText();

      if (
        propertyName === 'method' &&
        ts.isStringLiteral(property.initializer)
      ) {
        method = property.initializer.text;
      } else if (
        propertyName === 'path' &&
        ts.isStringLiteral(property.initializer)
      ) {
        path = property.initializer.text;
      } else if (propertyName === 'expose') {
        expose = property.initializer.getText() === 'true';
      } else if (propertyName === 'auth') {
        requiresAuth = property.initializer.getText() === 'true';
      }
    }
  }

  // Extract JSDoc information
  const jsdocInfo = extractJSDocInfo(node);

  // Extract type information
  const typeInfo = extractTypeInfo(node);

  // Extract path variables
  const pathVariables = extractPathVariables(path);

  // Generate example parameters and metadata
  let exampleParams: unknown = null;
  let parameterMetadata: PropertyMetadata[] = [];

  try {
    exampleParams = generateExampleParams(
      typeInfo.parameterType,
      sourceFile,
      method,
      typesSourceFile,
    );

    parameterMetadata = generateParameterMetadata(
      typeInfo.parameterType,
      sourceFile,
      typesSourceFile,
    );
  } catch {
    // If generation fails, continue without example params
    // Silently continue - detailed errors will be in the JSON output if needed
  }

  const endpoint: EndpointInfo = {
    name: functionName,
    method,
    path,
    expose,
    requiresAuth,
    pathVariables,
    description: jsdocInfo.description,
    parameterType: typeInfo.parameterType,
    returnType: typeInfo.returnType,
    jsdocParams: jsdocInfo.params,
    jsdocThrows: jsdocInfo.throws,
    exampleParams,
    parameterMetadata,
  };

  return endpoint;
}

/**
 * Main function - entry point of the script
 */
function main(): void {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.error('Usage: tsx analyze-endpoints.ts [path-to-controller-file]');
    process.exit(1);
  }

  const filePath = args[0];
  const absolutePath = path.resolve(filePath);

  const result = analyzeControllerFile(absolutePath);

  // Output only the JSON result
  console.log(JSON.stringify(result, null, 2));

  if (result.errors.length > 0) {
    process.exit(1);
  }
}

// Run the script if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { analyzeControllerFile };
export type { AnalysisResult };
