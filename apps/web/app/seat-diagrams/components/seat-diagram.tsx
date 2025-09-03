'use client';

import React from 'react';
import { SeatDiagramSpace } from '../seat-diagrams.schemas';
import DiagramSpace from './diagram-space/DiagramSpace';

/**
 * Calculate the maximum X and Y coordinates to determine grid size
 */
function calculateGridDimensions(spaces: SeatDiagramSpace[]): {
  maxX: number;
  maxY: number;
} {
  const maxX = Math.max(...spaces.map((space) => space.position.x));
  const maxY = Math.max(...spaces.map((space) => space.position.y));

  return { maxX, maxY };
}

/**
 * Create a map for O(1) position lookup: "x,y" -> space
 */
function createPositionMap(
  spaces: SeatDiagramSpace[],
): Map<string, SeatDiagramSpace> {
  const positionMap = new Map<string, SeatDiagramSpace>();

  spaces.forEach((space) => {
    const key = `${space.position.x},${space.position.y}`;
    positionMap.set(key, space);
  });

  return positionMap;
}

/**
 * Generate grid rows with appropriate components
 */
function generateGridRows(
  positionMap: Map<string, SeatDiagramSpace>,
  maxX: number,
  maxY: number,
  onClick: (space: SeatDiagramSpace) => void,
  selectedSpace: SeatDiagramSpace | null,
): React.JSX.Element[] {
  const gridRows: React.JSX.Element[] = [];

  for (let y = 0; y <= maxY; y++) {
    for (let x = 0; x <= maxX; x++) {
      const key = `${x},${y}`;
      const space = positionMap.get(key);

      if (!space) {
        // This should never happen, but we need to handle it
        continue;
      }

      gridRows.push(
        <div
          key={`${x}-${y}`}
          className="w-10 h-10 flex items-center justify-center"
        >
          <DiagramSpace
            space={space}
            onClick={onClick}
            isSelected={
              Boolean(selectedSpace?.spaceType) &&
              selectedSpace?.position.x === space.position.x &&
              selectedSpace?.position.y === space.position.y &&
              selectedSpace?.floorNumber === space.floorNumber
            }
          />
        </div>,
      );
    }
  }

  return gridRows;
}

interface SeatDiagramProps {
  spaces: SeatDiagramSpace[];
  floorNumber: number;
  onClick: (space: SeatDiagramSpace) => void;
  selectedSpace: SeatDiagramSpace | null;
}

/**
 * Renders a seat diagram based on spaces array
 * @param spaces - Array of space objects (seats, hallways, etc.)
 * @param floorNumber - Floor number to render
 * @returns JSX grid representation of the diagram
 */
export default function SeatDiagram({
  spaces,
  floorNumber,
  onClick,
  selectedSpace,
}: SeatDiagramProps) {
  // Step 1: Filter spaces for specific floor
  const floorSpaces = spaces.filter(
    (space) => space.floorNumber === floorNumber,
  );

  // Step 2: Calculate grid dimensions
  const { maxX, maxY } = calculateGridDimensions(floorSpaces);

  // Step 3: Create position map for O(1) lookup
  const positionMap = createPositionMap(floorSpaces);

  // Step 4: Generate grid rows
  const gridRows = generateGridRows(
    positionMap,
    maxX,
    maxY,
    onClick,
    selectedSpace,
  );

  return (
    <div
      className="grid gap-2 w-fit h-fit"
      style={{
        gridTemplateColumns: `repeat(${maxX + 1}, minmax(0, 1fr))`,
        gridTemplateRows: `repeat(${maxY + 1}, minmax(0, 1fr))`,
      }}
    >
      {gridRows}
    </div>
  );
}
