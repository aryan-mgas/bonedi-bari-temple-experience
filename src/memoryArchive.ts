export type MemoryMoment = {
  id: string
  title: string
  year: string
  caption: string
  image: string | null
}

// These are empty archive positions, ready for the family's real photographs.
// No sample or generated photographs are included in the experience.
const momentTitles = [
  'Pujo through the years',
  'The goddess',
  'Alankar & adornment',
  'The pandal takes shape',
  'Distinguished visitors',
  'When the family gathers',
  'The evening aarti',
  'Bhog & offering',
  'The sacred passage',
  'Dhunuchi moments',
  'Bijoya & farewell',
  'A moment to remember',
]

export const memoryArchive: MemoryMoment[] = momentTitles.map((title, index) => {
  const number = String(index + 1).padStart(2, '0')
  return {
    id: `memory-${number}`,
    title,
    year: 'Add year',
    caption: 'The family photograph and the story behind this Pujo moment will live here.',
    image: null,
  }
})
