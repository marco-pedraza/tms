import { useState } from 'react';

interface UseDeleteDialogProps {
  onConfirm: (deleteId: number) => void;
}

export default function useDeleteDialog({ onConfirm }: UseDeleteDialogProps) {
  const [deleteId, setDeleteId] = useState<number>();

  const onConfirmDelete = () => {
    if (!deleteId) return;
    onConfirm(deleteId);
    setDeleteId(undefined);
  };

  const onCancelDelete = () => {
    setDeleteId(undefined);
  };

  return {
    deleteId,
    setDeleteId,
    onConfirmDelete,
    onCancelDelete,
  };
}
