/**
 * Extracts only the fields that have been modified (dirty) from form data.
 * Highly compatible with `formState.dirtyFields` from react-hook-form.
 * Supports nested objects.
 *
 * @param data - The complete data object from the form
 * @param dirtyFields - Object marking the modified fields (from formState.dirtyFields)
 * @returns Partial object containing only the modified fields
 */
export function getDirtyFields<T extends Record<string, any>>(
  data: T,
  dirtyFields: Record<string, any>,
): Partial<T> {
  return Object.keys(dirtyFields).reduce((acc, key) => {
    const k = key as keyof T;
    const isDirty = dirtyFields[key];

    // If the value is directly true -> this field has been modified
    if (isDirty === true) {
      acc[k] = data[k];
    }
    // If it's a nested object, recurse to get the modified fields inside
    else if (
      typeof isDirty === 'object' &&
      isDirty !== null &&
      data[k] !== undefined
    ) {
      const nestedDirty = getDirtyFields(data[k], isDirty);
      if (Object.keys(nestedDirty).length > 0) {
        acc[k] = nestedDirty as any;
      }
    }

    return acc;
  }, {} as Partial<T>);
}
