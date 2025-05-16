'use client';

import { ArrowLeft, Pencil, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function BusLineSkeleton() {
  return (
    <div className="min-h-screen bg-gray-100 p-4">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <ArrowLeft className="h-5 w-5 text-gray-500" />
          <Skeleton className="h-7 w-40" />
        </div>
        <Skeleton className="h-5 w-64" />
      </div>

      {/* Action buttons */}
      <div className="flex justify-end gap-2 mb-4">
        <Pencil className="h-5 w-5 text-gray-400" />
        <Trash2 className="h-5 w-5 text-gray-400" />
      </div>

      {/* Content cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Basic Information Card */}
        <Card>
          <CardHeader>
            <CardTitle>
              <Skeleton className="h-6 w-48" />
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Name */}
            <div className="flex justify-between">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-5 w-32" />
            </div>

            {/* Code */}
            <div className="flex justify-between">
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-5 w-24" />
            </div>

            {/* Description */}
            <div className="flex justify-between">
              <Skeleton className="h-5 w-28" />
              <div className="w-3/5">
                <Skeleton className="h-5 w-full mb-1" />
                <Skeleton className="h-5 w-4/5 mb-1" />
                <Skeleton className="h-5 w-3/5" />
              </div>
            </div>

            {/* Transport Group */}
            <div className="flex justify-between">
              <Skeleton className="h-5 w-36" />
              <Skeleton className="h-5 w-28" />
            </div>

            {/* Service Type */}
            <div className="flex justify-between">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-5 w-16" />
            </div>

            {/* Status */}
            <div className="flex justify-between">
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
          </CardContent>
        </Card>

        {/* Visual Information Card */}
        <Card>
          <CardHeader>
            <CardTitle>
              <Skeleton className="h-6 w-48" />
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Logo */}
            <div className="flex justify-between items-center">
              <Skeleton className="h-5 w-16" />
              <Skeleton className="h-16 w-32 rounded-md" />
            </div>

            {/* Primary Color */}
            <div className="flex justify-between items-center">
              <Skeleton className="h-5 w-32" />
              <div className="flex items-center gap-2">
                <Skeleton className="h-6 w-6 rounded-sm" />
                <Skeleton className="h-5 w-20" />
              </div>
            </div>

            {/* Secondary Color */}
            <div className="flex justify-between items-center">
              <Skeleton className="h-5 w-36" />
              <div className="flex items-center gap-2">
                <Skeleton className="h-6 w-6 rounded-sm" />
                <Skeleton className="h-5 w-20" />
              </div>
            </div>

            {/* Created */}
            <div className="flex justify-between">
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-5 w-40" />
            </div>

            {/* Last Update */}
            <div className="flex justify-between">
              <Skeleton className="h-5 w-36" />
              <Skeleton className="h-5 w-40" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
