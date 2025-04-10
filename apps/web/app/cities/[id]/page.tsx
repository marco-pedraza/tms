'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { PageHeader, ActionButtons } from '@/components/ui-components';
import { cities, type City } from '@/lib/data';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export default function CityDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [city, setCity] = useState<City | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  useEffect(() => {
    const id = params.id as string;
    const foundCity = cities.find((c) => c.id === id);

    if (foundCity) {
      setCity(foundCity);
    } else {
      router.push('/cities');
    }
  }, [params.id, router]);

  const handleDelete = () => {
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    // In a real app, this would make an API call
    router.push('/cities');
  };

  if (!city) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <PageHeader
        title={city.name}
        description="City details"
        backHref="/cities"
      />

      <div className="flex justify-end mb-6">
        <ActionButtons
          editHref={`/cities/${city.id}/edit`}
          onDelete={handleDelete}
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-[1fr_2fr] gap-4">
              <dt className="font-medium">Name:</dt>
              <dd>{city.name}</dd>

              <dt className="font-medium">State/Province:</dt>
              <dd>{city.state_name}</dd>

              <dt className="font-medium">Country:</dt>
              <dd>{city.country_name}</dd>

              <dt className="font-medium">Timezone:</dt>
              <dd>{city.timezone}</dd>

              <dt className="font-medium">Status:</dt>
              <dd>
                {city.active ? (
                  <Badge variant="outline" className="bg-green-100">
                    Active
                  </Badge>
                ) : (
                  <Badge variant="outline" className="bg-red-100">
                    Inactive
                  </Badge>
                )}
              </dd>
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Location Information</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-[1fr_2fr] gap-4">
              <dt className="font-medium">Coordinates:</dt>
              <dd>
                {city.coordinates.latitude}, {city.coordinates.longitude}
              </dd>

              <dt className="font-medium">Slug:</dt>
              <dd>{city.slug}</dd>

              <dt className="font-medium">Created:</dt>
              <dd>{new Date(city.created_at).toLocaleString()}</dd>

              <dt className="font-medium">Last Updated:</dt>
              <dd>{new Date(city.updated_at).toLocaleString()}</dd>
            </dl>
          </CardContent>
        </Card>
      </div>

      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              city and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
