import type {
  Course,
  CourseAvailability,
  CourseCategory,
  CourseFormValues,
  CourseQuery,
  CourseStats,
  CourseStatus,
  CourseVisibility,
  EnrollmentPoint,
  Paginated,
  Teacher,
} from '../types'
import { delay } from './delay'

const teachers: Teacher[] = [
  { id: 't-1', name: 'Priya Sharma' },
  { id: 't-2', name: 'Rahul Verma' },
  { id: 't-3', name: 'Ananya Rao' },
  { id: 't-4', name: 'Vikram Iyer' },
  { id: 't-5', name: 'Neha Patel' },
]

const categories: CourseCategory[] = [
  { id: 'c-1', name: 'Programming', subjects: ['Python', 'JavaScript', 'Web Development'] },
  { id: 'c-2', name: 'Mathematics', subjects: ['Algebra', 'Calculus', 'Statistics'] },
  { id: 'c-3', name: 'Science', subjects: ['Physics', 'Chemistry', 'Biology'] },
  { id: 'c-4', name: 'Languages', subjects: ['English', 'Spanish'] },
  { id: 'c-5', name: 'Data & AI', subjects: ['Machine Learning', 'Data Analysis'] },
]

function pickStatus(i: number): CourseStatus {
  if (i % 7 === 3) return 'pending'
  if (i % 9 === 5) return 'draft'
  if (i % 11 === 4) return 'rejected'
  if (i % 6 === 2) return 'unpublished'
  return 'published'
}

function buildCourse(i: number, category: string, subject: string, title: string): Course {
  const status = pickStatus(i)
  const teacher = teachers[i % teachers.length]
  const hasEnrollments = status === 'published' || status === 'unpublished'

  return {
    id: `crs-${i + 1}`,
    title,
    description: `Learn ${subject} step by step with guided lessons, practice exercises, and AI-powered tutoring support.`,
    category,
    subject,
    teacherId: teacher.id,
    teacherName: teacher.name,
    status,
    visibility: i % 8 === 7 ? 'private' : 'public',
    availability: i % 10 === 9 ? 'closed' : 'open',
    price: [0, 19, 29, 49, 99][i % 5],
    enrollments: hasEnrollments ? 40 + ((i * 137) % 900) : 0,
    createdAt: new Date(Date.UTC(2025, i % 12, (i % 27) + 1, 10)).toISOString(),
    updatedAt: new Date(Date.UTC(2026, 5 + (i % 5), (i % 27) + 1, 12)).toISOString(),
    rejectionReason:
      status === 'rejected'
        ? 'Course outline is incomplete. Please add detailed lesson plans.'
        : undefined,
  }
}

const pairs = categories.flatMap((c) =>
  c.subjects.map((subject) => ({ category: c.name, subject })),
)

const courses: Course[] = pairs.flatMap((pair, k) =>
  [0, 1].map((level) =>
    buildCourse(
      k * 2 + level,
      pair.category,
      pair.subject,
      level === 0 ? `${pair.subject} Fundamentals` : `Advanced ${pair.subject}`,
    ),
  ),
)

let nextCourseId = courses.length + 1
let nextCategoryId = categories.length + 1

function findCourseIndex(id: string) {
  const index = courses.findIndex((c) => c.id === id)
  if (index === -1) throw new Error('Course not found')
  return index
}

function findTeacher(id: string) {
  const teacher = teachers.find((t) => t.id === id)
  if (!teacher) throw new Error('Selected teacher does not exist')
  return teacher
}

function findCategory(id: string) {
  const category = categories.find((c) => c.id === id)
  if (!category) throw new Error('Category not found')
  return category
}

/* ---------- Courses ---------- */

export async function getCourses(query: CourseQuery): Promise<Paginated<Course>> {
  await delay(400)

  const term = query.search.trim().toLowerCase()

  const filtered = courses.filter((c) => {
    const matchesSearch =
      !term ||
      c.title.toLowerCase().includes(term) ||
      c.subject.toLowerCase().includes(term) ||
      c.teacherName.toLowerCase().includes(term)
    const matchesCategory = query.category === 'all' || c.category === query.category
    const matchesStatus = query.status === 'all' || c.status === query.status
    return matchesSearch && matchesCategory && matchesStatus
  })

  const sorted = [...filtered].sort((a, b) => {
    const left = a[query.sortBy]
    const right = b[query.sortBy]
    const cmp =
      typeof left === 'number' && typeof right === 'number'
        ? left - right
        : String(left).localeCompare(String(right))
    return query.sortDir === 'asc' ? cmp : -cmp
  })

  const start = (query.page - 1) * query.pageSize

  return {
    items: sorted.slice(start, start + query.pageSize),
    total: sorted.length,
    page: query.page,
    pageSize: query.pageSize,
  }
}

export async function getCourseById(id: string): Promise<Course> {
  await delay(300)
  return courses[findCourseIndex(id)]
}

export async function getCourseStats(): Promise<CourseStats> {
  await delay(300)
  return {
    totalCourses: courses.length,
    published: courses.filter((c) => c.status === 'published').length,
    pendingApproval: courses.filter((c) => c.status === 'pending').length,
    totalEnrollments: courses.reduce((sum, c) => sum + c.enrollments, 0),
  }
}

export async function getCourseEnrollmentTrend(id: string): Promise<EnrollmentPoint[]> {
  await delay(400)
  const course = courses[findCourseIndex(id)]
  const months = ['Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov']
  const weights = [0.08, 0.12, 0.18, 0.2, 0.22, 0.2]

  return months.map((month, i) => ({
    month,
    enrollments: Math.round(course.enrollments * weights[i]),
  }))
}

export async function createCourse(values: CourseFormValues): Promise<Course> {
  await delay(600)
  const teacher = findTeacher(values.teacherId)
  const now = new Date().toISOString()

  const course: Course = {
    id: `crs-${nextCourseId++}`,
    title: values.title.trim(),
    description: values.description.trim(),
    category: values.category,
    subject: values.subject,
    teacherId: teacher.id,
    teacherName: teacher.name,
    status: values.publishNow ? 'published' : 'draft',
    visibility: values.visibility,
    availability: values.availability,
    price: Number(values.price),
    enrollments: 0,
    createdAt: now,
    updatedAt: now,
  }

  courses.unshift(course)
  return course
}

export async function updateCourse(id: string, values: CourseFormValues): Promise<Course> {
  await delay(600)
  const index = findCourseIndex(id)
  const teacher = findTeacher(values.teacherId)

  courses[index] = {
    ...courses[index],
    title: values.title.trim(),
    description: values.description.trim(),
    category: values.category,
    subject: values.subject,
    teacherId: teacher.id,
    teacherName: teacher.name,
    visibility: values.visibility,
    availability: values.availability,
    price: Number(values.price),
    updatedAt: new Date().toISOString(),
  }

  return courses[index]
}

export async function updateCourseStatus(
  id: string,
  status: CourseStatus,
  reason?: string,
): Promise<Course> {
  await delay(500)
  const index = findCourseIndex(id)

  courses[index] = {
    ...courses[index],
    status,
    rejectionReason: status === 'rejected' ? reason?.trim() : undefined,
    updatedAt: new Date().toISOString(),
  }

  return courses[index]
}

export async function assignTeacher(id: string, teacherId: string): Promise<Course> {
  await delay(500)
  const index = findCourseIndex(id)
  const teacher = findTeacher(teacherId)

  courses[index] = {
    ...courses[index],
    teacherId: teacher.id,
    teacherName: teacher.name,
    updatedAt: new Date().toISOString(),
  }

  return courses[index]
}

export async function updateCourseSettings(
  id: string,
  settings: { visibility: CourseVisibility; availability: CourseAvailability },
): Promise<Course> {
  await delay(500)
  const index = findCourseIndex(id)

  courses[index] = {
    ...courses[index],
    ...settings,
    updatedAt: new Date().toISOString(),
  }

  return courses[index]
}

export async function deleteCourse(id: string): Promise<void> {
  await delay(500)
  courses.splice(findCourseIndex(id), 1)
}

/* ---------- Teachers ---------- */

export async function getTeachers(): Promise<Teacher[]> {
  await delay(300)
  return teachers.map((t) => ({ ...t }))
}

/* ---------- Categories & subjects ---------- */

export async function getCategories(): Promise<CourseCategory[]> {
  await delay(300)
  return categories.map((c) => ({ ...c, subjects: [...c.subjects] }))
}

export async function addCategory(name: string): Promise<void> {
  await delay(400)
  const clean = name.trim()
  if (!clean) throw new Error('Category name is required')
  if (categories.some((c) => c.name.toLowerCase() === clean.toLowerCase())) {
    throw new Error('This category already exists')
  }
  categories.push({ id: `c-${nextCategoryId++}`, name: clean, subjects: [] })
}

export async function deleteCategory(id: string): Promise<void> {
  await delay(400)
  const category = findCategory(id)
  if (courses.some((c) => c.category === category.name)) {
    throw new Error('Cannot delete a category that still has courses')
  }
  categories.splice(categories.indexOf(category), 1)
}

export async function addSubject(categoryId: string, name: string): Promise<void> {
  await delay(400)
  const category = findCategory(categoryId)
  const clean = name.trim()
  if (!clean) throw new Error('Subject name is required')
  if (category.subjects.some((s) => s.toLowerCase() === clean.toLowerCase())) {
    throw new Error('This subject already exists in the category')
  }
  category.subjects.push(clean)
}

export async function removeSubject(categoryId: string, name: string): Promise<void> {
  await delay(400)
  const category = findCategory(categoryId)
  if (courses.some((c) => c.category === category.name && c.subject === name)) {
    throw new Error('Cannot remove a subject that still has courses')
  }
  category.subjects = category.subjects.filter((s) => s !== name)
}