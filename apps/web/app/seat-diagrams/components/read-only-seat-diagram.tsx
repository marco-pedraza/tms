'use client';

import React, { useState } from 'react';
import { Bath, MoveUpRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import AmenityCardCompact from '@/components/ui/amenity-card-compact';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useQueryBusAmenities } from '@/hooks/use-query-bus-amenities';
import { SeatType, SpaceType } from '@/services/ims-client';
import { SeatDiagramSpace, SeatSpaceType } from '../seat-diagrams.schemas';
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
 * Generate grid rows with appropriate components for read-only display
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
            onClick={(clickedSpace) => {
              onClick(clickedSpace);
            }}
            isSelected={
              Boolean(selectedSpace?.spaceType) &&
              selectedSpace?.position.x === space.position.x &&
              selectedSpace?.position.y === space.position.y &&
              selectedSpace?.floorNumber === space.floorNumber
            }
            readOnly={false} // Allow clicks in read-only mode for selection
          />
        </div>,
      );
    }
  }

  return gridRows;
}

interface ReadOnlySeatDiagramProps {
  seatSpaces: {
    floorNumber: number;
    spaces: SeatDiagramSpace[];
  }[];
}

/**
 * Renders a read-only seat diagram with floor selection and space details
 * This component displays the seat layout without editing capabilities but allows
 * floor navigation and space selection for viewing details
 *
 * @param seatSpaces - Array of floors with their spaces
 * @returns JSX representation of the interactive read-only diagram
 */
export default function ReadOnlySeatDiagram({
  seatSpaces,
}: ReadOnlySeatDiagramProps) {
  const tSeatDiagrams = useTranslations('seatDiagrams');
  const [selectedFloor, setSelectedFloor] = useState<number>(1);
  const [selectedSpace, setSelectedSpace] = useState<SeatDiagramSpace | null>(
    null,
  );

  // Query bus amenities for detailed information
  const { data: busAmenities = [] } = useQueryBusAmenities();

  // Handle empty spaces array
  if (seatSpaces.length === 0) {
    return (
      <div className="flex items-center justify-center p-8 text-gray-500">
        {tSeatDiagrams('readOnly.spaceInfo.emptySpaces')}
      </div>
    );
  }

  // Get current floor spaces
  const currentFloor =
    seatSpaces.find((floor) => floor.floorNumber === selectedFloor) ??
    seatSpaces[0];
  const floorSpaces = currentFloor?.spaces ?? [];

  // Handle empty floor
  if (floorSpaces.length === 0) {
    return (
      <div className="flex items-center justify-center p-8 text-gray-500">
        {tSeatDiagrams('readOnly.spaceInfo.emptySpaces')}
      </div>
    );
  }

  // Calculate grid dimensions
  const { maxX, maxY } = calculateGridDimensions(floorSpaces);

  // Create position map for O(1) lookup
  const positionMap = createPositionMap(floorSpaces);

  // Handle space click
  const handleSpaceClick = (space: SeatDiagramSpace) => {
    setSelectedSpace(space);
  };

  // Generate grid rows
  const gridRows = generateGridRows(
    positionMap,
    maxX,
    maxY,
    handleSpaceClick,
    selectedSpace,
  );

  return (
    <div className="space-y-4 w-full">
      {/* Floor selection buttons */}
      {seatSpaces.length > 1 && (
        <div className="flex gap-1">
          {seatSpaces.map((floor) => (
            <Button
              variant="outline"
              size="sm"
              key={floor.floorNumber}
              onClick={() => {
                setSelectedFloor(floor.floorNumber);
                setSelectedSpace(null); // Reset selection when changing floors
              }}
              type="button"
              className={
                selectedFloor === floor.floorNumber
                  ? 'bg-primary text-primary-foreground ring'
                  : ''
              }
            >
              {tSeatDiagrams('fields.floor', {
                floorNumber: floor.floorNumber,
              })}
            </Button>
          ))}
        </div>
      )}

      {/* Main diagram layout */}
      <div className="min-h-[500px] h-[70vh] max-h-[700px]">
        <div className="grid gap-4 grid-cols-[3fr_auto_2fr] h-full">
          {/* Diagram */}
          <div className="space-y-4 p-4 w-full h-full overflow-x-auto flex justify-center">
            <div className="relative">
              <div
                className="grid gap-2 w-max h-full"
                style={{
                  gridTemplateColumns: `repeat(${maxX + 1}, 40px)`,
                  gridTemplateRows: `repeat(${maxY + 1}, 40px)`,
                }}
              >
                {gridRows}
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="p-4 pt-20 text-sm">
            <ul className="space-y-2">
              <li className="flex items-center gap-2">
                <span className="w-3 h-3 bg-white border border-gray-300 rounded-full" />
                {tSeatDiagrams('form.placeholders.seatTypes', {
                  seatType: SeatType.REGULAR,
                })}
              </li>
              <li className="flex items-center gap-2">
                <span className="w-3 h-3 bg-purple-100 border border-purple-500 rounded-full" />
                {tSeatDiagrams('form.placeholders.seatTypes', {
                  seatType: SeatType.PREMIUM,
                })}
              </li>
              <li className="flex items-center gap-2">
                <span className="w-3 h-3 bg-green-100 border border-green-500 rounded-full" />
                {tSeatDiagrams('form.placeholders.seatTypes', {
                  seatType: SeatType.VIP,
                })}
              </li>
              <li className="flex items-center gap-2">
                <span className="w-3 h-3 bg-blue-100 border border-blue-500 rounded-full" />
                {tSeatDiagrams('form.placeholders.seatTypes', {
                  seatType: SeatType.BUSINESS,
                })}
              </li>
              <li className="flex items-center gap-2">
                <span className="w-3 h-3 bg-yellow-100 border border-yellow-500 rounded-full" />
                {tSeatDiagrams('form.placeholders.seatTypes', {
                  seatType: SeatType.EXECUTIVE,
                })}
              </li>
              <li className="flex items-center gap-2">
                <Bath className="w-3 h-3" />
                {tSeatDiagrams('form.spaceTypes.bathroom')}
              </li>
              <li className="flex items-center gap-2">
                <MoveUpRight className="w-3 h-3" />
                {tSeatDiagrams('form.spaceTypes.stairs')}
              </li>
              <li className="flex items-center gap-2">
                <span className="w-3 h-3 bg-white border-dashed border-2 border-gray-300 rounded-full" />
                {tSeatDiagrams('form.spaceTypes.empty')}
              </li>
            </ul>
          </div>

          {/* Space details card */}
          <Card className="h-full">
            <CardHeader>
              <CardTitle>{tSeatDiagrams('readOnly.spaceInfo.title')}</CardTitle>
            </CardHeader>
            <CardContent className="h-full overflow-y-auto">
              {!selectedSpace ? (
                <div className="text-muted-foreground">
                  {tSeatDiagrams('readOnly.spaceInfo.selectPrompt')}
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">
                      {tSeatDiagrams('readOnly.spaceInfo.labels.spaceType')}
                    </label>
                    <p className="text-sm text-muted-foreground">
                      {tSeatDiagrams(
                        `form.spaceTypes.${selectedSpace.spaceType}`,
                      )}
                    </p>
                  </div>

                  {selectedSpace.spaceType === SpaceType.SEAT && (
                    <>
                      <div>
                        <label className="text-sm font-medium">
                          {tSeatDiagrams('readOnly.spaceInfo.labels.seatType')}
                        </label>
                        <p className="text-sm text-muted-foreground">
                          {tSeatDiagrams(
                            `form.seatTypes.${(selectedSpace as SeatSpaceType).seatType}`,
                          )}
                        </p>
                      </div>

                      <div>
                        <label className="text-sm font-medium">
                          {tSeatDiagrams(
                            'readOnly.spaceInfo.labels.seatNumber',
                          )}
                        </label>
                        <p className="text-sm text-muted-foreground">
                          {(selectedSpace as SeatSpaceType).seatNumber ??
                            tSeatDiagrams('readOnly.spaceInfo.values.noNumber')}
                        </p>
                      </div>

                      {(selectedSpace as SeatSpaceType).reclinementAngle !==
                        undefined &&
                        (selectedSpace as SeatSpaceType).reclinementAngle !==
                          null && (
                          <div>
                            <label className="text-sm font-medium">
                              {tSeatDiagrams(
                                'readOnly.spaceInfo.labels.reclinementAngle',
                              )}
                            </label>
                            <p className="text-sm text-muted-foreground">
                              {
                                (selectedSpace as SeatSpaceType)
                                  .reclinementAngle
                              }
                              °
                            </p>
                          </div>
                        )}

                      {(selectedSpace as SeatSpaceType).amenities &&
                        (selectedSpace as SeatSpaceType).amenities.length >
                          0 && (
                          <div>
                            <label className="text-sm font-medium">
                              {tSeatDiagrams(
                                'readOnly.spaceInfo.labels.amenities',
                              )}
                            </label>
                            <div className="mt-2 flex flex-wrap gap-1">
                              {(selectedSpace as SeatSpaceType).amenities
                                .map((amenityId) => {
                                  const amenity = busAmenities.find(
                                    (a) =>
                                      a.id.toString() === amenityId.toString(),
                                  );
                                  return amenity ? (
                                    <AmenityCardCompact
                                      key={amenity.id}
                                      amenity={amenity}
                                    />
                                  ) : null;
                                })
                                .filter(Boolean)}
                            </div>
                          </div>
                        )}
                    </>
                  )}

                  <div>
                    <label className="text-sm font-medium">
                      {tSeatDiagrams('readOnly.spaceInfo.labels.status')}
                    </label>
                    <p className="text-sm text-muted-foreground">
                      {selectedSpace.active
                        ? tSeatDiagrams('readOnly.spaceInfo.values.active')
                        : tSeatDiagrams('readOnly.spaceInfo.values.inactive')}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
