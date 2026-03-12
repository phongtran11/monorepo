export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .normalize('NFD') // Normalize to decomposed form for handling accented characters
    .replace(/[\u0300-\u036f]/g, '') // Remove accented characters
    .replace(/[đĐ]/g, 'd') // Specifically handle Vietnamese 'đ'
    .replace(/[^a-z0-9 -]/g, '') // Remove non-alphanumeric characters except spaces and hyphens
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-'); // Replace multiple hyphens with a single one
}
