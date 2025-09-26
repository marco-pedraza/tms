import * as path from 'path';
import {
  type AnalysisResult,
  type EndpointInfo,
  type PropertyMetadata,
  analyzeControllerFile,
} from './analyze-endpoints';
import {
  safeExistsSync,
  safeMkdirSync,
  safeReaddirSync,
  safeStatSync,
  safeWriteFileSync,
} from './fs-utils';
import {
  type PostmanCollection,
  type PostmanItem,
  type PostmanQueryParam,
  type PostmanRequest,
  type PostmanUrl,
  type PostmanVariable,
} from './types';

/**
 * Configuration for the Postman collection generator
 */
const CONFIG = {
  outputPath:
    './tools/postman-generator/output/inventory-api.postman_collection.json',
  baseUrl: 'http://localhost:4000',
  collectionName: 'IMS Inventory API',
  environmentName: 'IMS Development',
  includeTests: true,
  includeDocumentation: true,
};

/**
 * Extracts folder structure from a controller file path
 */
function extractFolderStructure(filePath: string): string[] {
  let relativePath: string;

  const serverIndex = filePath.indexOf('/server/');
  if (serverIndex !== -1) {
    relativePath = filePath.substring(serverIndex + 8);
  } else {
    relativePath = filePath;
  }

  const pathParts = relativePath.split('/');
  pathParts.pop(); // Remove the controller file name

  return pathParts.filter((part) => part.length > 0);
}

/**
 * Converts path variables from Encore format to Postman format
 */
function convertPathVariables(path: string): string {
  return path.replace(/:([a-zA-Z_][a-zA-Z0-9_]*)/g, '{{$1}}');
}

/**
 * Converts camelCase function name to readable title
 */
function convertFunctionNameToTitle(functionName: string): string {
  const patterns = [
    { regex: /^create(.+)/, replacement: 'Create $1' },
    { regex: /^get(.+)/, replacement: 'Get $1' },
    { regex: /^list(.+)Paginated$/, replacement: 'List $1 (Paginated)' },
    { regex: /^list(.+)/, replacement: 'List $1' },
    { regex: /^update(.+)/, replacement: 'Update $1' },
    { regex: /^delete(.+)/, replacement: 'Delete $1' },
    { regex: /^assign(.+)To(.+)/, replacement: 'Assign $1 To $2' },
    { regex: /^find(.+)By(.+)/, replacement: 'Find $1 By $2' },
    { regex: /^sync(.+)/, replacement: 'Sync $1' },
  ];

  for (const pattern of patterns) {
    const match = functionName.match(pattern.regex);
    if (match) {
      let result = pattern.replacement;
      for (let i = 1; i < match.length; i++) {
        result = result.replace(`$${i}`, convertCamelCaseToWords(match[i]));
      }
      return result;
    }
  }

  return convertCamelCaseToWords(functionName);
}

/**
 * Converts camelCase string to space-separated words
 */
function convertCamelCaseToWords(str: string): string {
  return str
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/([A-Z])([A-Z][a-z])/g, '$1 $2')
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Generates request body for Postman
 */
function generateRequestBody(endpoint: EndpointInfo): string | undefined {
  const method = endpoint.method.toLowerCase();

  if (!['post', 'put', 'patch'].includes(method)) {
    return undefined;
  }

  if (!endpoint.exampleParams || !endpoint.parameterMetadata) {
    return undefined;
  }

  const pathVars = endpoint.pathVariables ?? [];
  let bodyParams = { ...(endpoint.exampleParams as Record<string, unknown>) };

  for (const pathVar of pathVars) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { [pathVar]: _, ...rest } = bodyParams;
    bodyParams = rest;
  }

  return generateJsonWithComments(bodyParams);
}

/**
 * Generates query parameters for Postman
 */
function generateQueryParams(endpoint: EndpointInfo): PostmanQueryParam[] {
  const method = endpoint.method.toLowerCase();

  if (!['get', 'delete'].includes(method)) {
    return [];
  }

  if (!endpoint.exampleParams || !endpoint.parameterMetadata) {
    return [];
  }

  const pathVars = endpoint.pathVariables || [];
  const queryParams: PostmanQueryParam[] = [];

  for (const [key, value] of Object.entries(endpoint.exampleParams)) {
    if (!pathVars.includes(key)) {
      const metadata = endpoint.parameterMetadata.find(
        (m: PropertyMetadata) => m.name === key,
      );
      const isOptional = metadata?.isOptional ?? false;

      queryParams.push({
        key,
        value: String(value),
        disabled: isOptional,
      });
    }
  }

  return queryParams;
}

/**
 * Generates JSON string with proper formatting
 */
function generateJsonWithComments(obj: Record<string, unknown>): string {
  const lines: string[] = [];
  lines.push('{');

  const entries = Object.entries(obj);

  for (const [i, [key, value]] of entries.entries()) {
    const isLast = i === entries.length - 1;

    let line = `  "${key}": ${JSON.stringify(value)}`;

    if (!isLast) {
      line += ',';
    }

    lines.push(line);
  }

  lines.push('}');
  return lines.join('\n');
}

/**
 * Generates description text with optional properties information
 */
function generateRequestDescription(endpoint: EndpointInfo): string {
  const parts: string[] = [];

  // Add JSDoc description if available
  if (endpoint.description) {
    parts.push(endpoint.description);
  }

  // Add optional properties information
  if (endpoint.parameterMetadata && endpoint.parameterMetadata.length > 0) {
    const optionalProps = endpoint.parameterMetadata
      .filter((meta) => meta.isOptional)
      .map((meta) => meta.name);

    if (optionalProps.length > 0) {
      parts.push(`Optional properties: ${optionalProps.join(', ')}`);
    }
  }

  return parts.join('\n\n');
}

/**
 * Converts an endpoint to a Postman request
 */
function convertEndpointToRequest(endpoint: EndpointInfo): PostmanRequest {
  const rawUrl = `{{base_url}}${convertPathVariables(endpoint.path)}`;
  const body = generateRequestBody(endpoint);
  const queryParams = generateQueryParams(endpoint);

  const description = generateRequestDescription(endpoint);

  // Build PostmanUrl object with raw, path, and query only
  const postmanUrl: PostmanUrl = {
    raw: rawUrl,
    path: convertPathVariables(endpoint.path)
      .split('/')
      .filter((segment) => segment.length > 0),
    query: queryParams,
  };

  const request: PostmanRequest = {
    method: endpoint.method.toUpperCase(),
    url: postmanUrl,
    header: [
      {
        key: 'Content-Type',
        value: 'application/json',
        type: 'text',
      },
    ],
  };

  // Add description if available
  if (description) {
    request.description = description;
  }

  if (body) {
    request.body = {
      mode: 'raw',
      raw: body,
      options: {
        raw: {
          language: 'json',
        },
      },
    };
  }

  return request;
}

/**
 * Recursively finds all .controller.ts files in a directory
 */
function findControllerFiles(directory: string): string[] {
  const controllerFiles: string[] = [];

  function walkDirectory(dir: string): void {
    try {
      const entries = safeReaddirSync(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
          if (
            ![
              'node_modules',
              '.git',
              'dist',
              'build',
              'coverage',
              'tools',
            ].includes(entry.name)
          ) {
            walkDirectory(fullPath);
          }
        } else if (entry.isFile() && entry.name.endsWith('.controller.ts')) {
          controllerFiles.push(fullPath);
        }
      }
    } catch {
      // Silently skip directories that can't be read
    }
  }

  walkDirectory(directory);
  return controllerFiles;
}

/**
 * Analyzes all controller files in a given directory
 */
function orchestrateAnalysis(baseDirectory: string): AnalysisResult[] {
  const absoluteBaseDir = path.resolve(baseDirectory);

  if (!safeExistsSync(absoluteBaseDir)) {
    throw new Error(`Directory does not exist: ${absoluteBaseDir}`);
  }

  if (!safeStatSync(absoluteBaseDir).isDirectory()) {
    throw new Error(`Path is not a directory: ${absoluteBaseDir}`);
  }

  const controllerFiles = findControllerFiles(absoluteBaseDir);

  console.log(
    `📁 Analyzing ${controllerFiles.length} controllers in ${path.basename(absoluteBaseDir)}`,
  );

  const results: AnalysisResult[] = [];
  let successfulAnalyses = 0;

  for (const controllerFile of controllerFiles) {
    const relativePath = path.relative(absoluteBaseDir, controllerFile);

    try {
      const result = analyzeControllerFile(controllerFile);
      results.push(result);

      if (result.errors.length > 0) {
        console.log(`❌ ${relativePath}: ${result.errors.length} errors`);
      } else {
        successfulAnalyses++;
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.log(`❌ ${relativePath}: ${errorMessage}`);

      const failedResult: AnalysisResult = {
        filePath: controllerFile,
        endpoints: [],
        errors: [errorMessage],
      };

      results.push(failedResult);
    }
  }

  const totalEndpoints = results.reduce(
    (sum, r) => sum + r.endpoints.length,
    0,
  );
  console.log(
    `✅ ${successfulAnalyses}/${controllerFiles.length} controllers, ${totalEndpoints} endpoints`,
  );

  return results;
}

/**
 * Generates a complete Postman collection from analysis results
 */
function generatePostmanCollectionFromAnalysis(
  controllerResults: AnalysisResult[],
): PostmanCollection {
  const pathVariables = new Set<string>();
  const rootItems: PostmanItem[] = [];
  const processedPaths = new Set<string>();

  for (const controllerResult of controllerResults) {
    const folderStructure = extractFolderStructure(controllerResult.filePath);

    if (folderStructure.length === 0) {
      // Controller at root level
      for (const endpoint of controllerResult.endpoints) {
        if (endpoint.pathVariables) {
          endpoint.pathVariables.forEach((pv: string) => pathVariables.add(pv));
        }

        const request = convertEndpointToRequest(endpoint);
        rootItems.push({
          name: convertFunctionNameToTitle(endpoint.name),
          request,
        });
      }
    } else {
      // Build nested structure
      buildNestedStructure(
        rootItems,
        folderStructure,
        controllerResult,
        processedPaths,
        pathVariables,
      );
    }
  }

  // Create collection variables
  const variables: PostmanVariable[] = [
    {
      key: 'base_url',
      value: CONFIG.baseUrl,
      type: 'string',
    },
  ];

  // Add path variables
  pathVariables.forEach((pv) => {
    variables.push({
      key: pv,
      value: '1',
      type: 'string',
    });
  });

  return {
    info: {
      name: CONFIG.collectionName,
      description: `Generated API collection for IMS Inventory Management System`,
      schema:
        'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
      version: '1.0.0',
    },
    variable: variables,
    item: rootItems,
  };
}

/**
 * Helper function to build nested folder structure
 */
function buildNestedStructure(
  rootItems: PostmanItem[],
  folderStructure: string[],
  controllerResult: AnalysisResult,
  processedPaths: Set<string>,
  pathVariables: Set<string>,
): void {
  let currentLevel = rootItems;
  let currentPath = '';

  for (let i = 0; i < folderStructure.length; i++) {
    const folderName = folderStructure[i];
    currentPath = currentPath ? `${currentPath}/${folderName}` : folderName;

    // Find or create folder at current level
    let folder = currentLevel.find(
      (item) => item.name === folderName && item.item,
    );

    if (!folder) {
      folder = {
        name: folderName,
        item: [],
      };
      currentLevel.push(folder);
    }

    // If this is the last folder, add endpoints
    if (i === folderStructure.length - 1) {
      for (const endpoint of controllerResult.endpoints) {
        if (endpoint.pathVariables) {
          endpoint.pathVariables.forEach((pv: string) => pathVariables.add(pv));
        }

        const request = convertEndpointToRequest(endpoint);
        if (folder.item) {
          folder.item.push({
            name: convertFunctionNameToTitle(endpoint.name),
            request,
          });
        }
      }
    } else {
      // Move to next level
      if (folder.item) {
        currentLevel = folder.item;
      }
    }
  }
}

/**
 * Main function to generate Postman collection
 * @param baseDir - Base directory to analyze (defaults to process.cwd())
 */
export function generatePostmanCollection(baseDir?: string): void {
  // Use process.cwd() as default if no baseDir provided
  const analysisBaseDir = baseDir ?? process.cwd();

  // Ensure output directory exists
  const outputDir = path.dirname(CONFIG.outputPath);
  if (!safeExistsSync(outputDir)) {
    safeMkdirSync(outputDir, { recursive: true });
  }

  // Analyze all controllers
  const controllerResults = orchestrateAnalysis(analysisBaseDir);

  const successfulResults = controllerResults.filter(
    (r) => r.errors.length === 0,
  );
  if (successfulResults.length === 0) {
    throw new Error('No controllers were successfully analyzed');
  }

  // Generate Postman collection
  console.log('🚀 Generating Postman collection...');
  const collection = generatePostmanCollectionFromAnalysis(controllerResults);

  // Write collection to file
  safeWriteFileSync(CONFIG.outputPath, JSON.stringify(collection, null, 2));

  const totalEndpoints = controllerResults.reduce(
    (sum, r) => sum + r.endpoints.length,
    0,
  );
  const failedCount = controllerResults.length - successfulResults.length;

  console.log(`💾 Collection saved to: ${CONFIG.outputPath}`);
  console.log(
    `📊 Generated ${collection.variable?.length || 0} variables and ${totalEndpoints} requests`,
  );

  if (failedCount > 0) {
    console.log(`⚠️  ${failedCount} controllers had errors`);
  }
}
