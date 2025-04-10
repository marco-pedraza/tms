'use client';

import type React from 'react';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { PageHeader } from '@/components/ui-components';
import { cities, states } from '@/lib/data';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function EditCityPage() {
  const params = useParams();
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    state_id: '',
    timezone: '',
    latitude: '',
    longitude: '',
    slug: '',
    active: true,
  });

  useEffect(() => {
    const id = params.id as string;
    const city = cities.find((c) => c.id === id);

    if (city) {
      setFormData({
        name: city.name,
        state_id: city.state_id,
        timezone: city.timezone,
        latitude: city.coordinates.latitude.toString(),
        longitude: city.coordinates.longitude.toString(),
        slug: city.slug,
        active: city.active,
      });
    } else {
      router.push('/cities');
    }
  }, [params.id, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSwitchChange = (checked: boolean) => {
    setFormData((prev) => ({ ...prev, active: checked }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // In a real app, this would make an API call
    // For now, we'll just redirect back to the city details
    router.push(`/cities/${params.id}`);
  };

  return (
    <div>
      <PageHeader
        title="Edit City"
        description="Update city information"
        backHref={`/cities/${params.id}`}
      />

      <form onSubmit={handleSubmit}>
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>City Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">City Name</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter city name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="state">State/Province</Label>
              <Select
                onValueChange={(value) => handleSelectChange('state_id', value)}
                value={formData.state_id}
              >
                <SelectTrigger id="state">
                  <SelectValue placeholder="Select a state/province" />
                </SelectTrigger>
                <SelectContent>
                  {states.map((state) => (
                    <SelectItem key={state.id} value={state.id}>
                      {state.name}, {state.country_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="timezone">Zona Horaria</Label>
              <Select
                onValueChange={(value) => handleSelectChange('timezone', value)}
                value={formData.timezone}
              >
                <SelectTrigger id="timezone">
                  <SelectValue placeholder="Selecciona una zona horaria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="America/Mexico_City">
                    America/Mexico_City
                  </SelectItem>
                  <SelectItem value="America/Tijuana">
                    America/Tijuana
                  </SelectItem>
                  <SelectItem value="America/Hermosillo">
                    America/Hermosillo
                  </SelectItem>
                  <SelectItem value="America/Chihuahua">
                    America/Chihuahua
                  </SelectItem>
                  <SelectItem value="America/Cancun">America/Cancun</SelectItem>
                  <SelectItem value="America/Bogota">America/Bogota</SelectItem>
                  <SelectItem value="America/Lima">America/Lima</SelectItem>
                  <SelectItem value="America/Santiago">
                    America/Santiago
                  </SelectItem>
                  <SelectItem value="America/Buenos_Aires">
                    America/Buenos_Aires
                  </SelectItem>
                  <SelectItem value="America/Sao_Paulo">
                    America/Sao_Paulo
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="latitude">Latitude</Label>
                <Input
                  id="latitude"
                  name="latitude"
                  value={formData.latitude}
                  onChange={handleChange}
                  placeholder="Enter latitude"
                  required
                  type="number"
                  step="0.0001"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="longitude">Longitude</Label>
                <Input
                  id="longitude"
                  name="longitude"
                  value={formData.longitude}
                  onChange={handleChange}
                  placeholder="Enter longitude"
                  required
                  type="number"
                  step="0.0001"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">Slug</Label>
              <Input
                id="slug"
                name="slug"
                value={formData.slug}
                onChange={handleChange}
                placeholder="Enter slug (e.g., new-york-city)"
                required
              />
              <p className="text-sm text-muted-foreground">
                URL-friendly version of the city name
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="active"
                checked={formData.active}
                onCheckedChange={handleSwitchChange}
              />
              <Label htmlFor="active">Active</Label>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push(`/cities/${params.id}`)}
              >
                Cancel
              </Button>
              <Button type="submit">Update City</Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
