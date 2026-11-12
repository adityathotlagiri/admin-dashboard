import { Check, EyeOff, Globe, X, type LucideIcon } from 'lucide-react'
import type { Course, CourseFormValues, CourseStatus } from '../../types'

export interface CourseAction {
  label: string
  next: CourseStatus
  icon: LucideIcon
  doneLabel: string
  danger?: boolean
  requiresReason?: boolean
  confirm: (title: string) => string
}

const approve: CourseAction = {
  label: 'Approve',
  next: 'published',
  icon: Check,
  doneLabel: 'approved and published',
  confirm: (title) => `Approve "${title}"? It will be published and visible to students.`,
}

const reject: CourseAction = {
  label: 'Reject',
  next: 'rejected',
  icon: X,
  doneLabel: 'rejected',
  danger: true,
  requiresReason: true,
  confirm: (title) => `Reject "${title}"?`,
}

const publish: CourseAction = {
  label: 'Publish',
  next: 'published',
  icon: Globe,
  doneLabel: 'published',
  confirm: (title) => `Publish "${title}"? It will become visible to students.`,
}

const unpublish: CourseAction = {
  label: 'Unpublish',
  next: 'unpublished',
  icon: EyeOff,
  doneLabel: 'unpublished',
  danger: true,
  confirm: (title) => `Unpublish "${title}"? Students will no longer be able to find it.`,
}

export function getCourseActions(status: CourseStatus): CourseAction[] {
  switch (status) {
    case 'pending':
      return [approve, reject]
    case 'published':
      return [unpublish]
    case 'unpublished':
      return [publish]
    case 'draft':
      return [publish]
    case 'rejected':
      return [approve]
  }
}

export function courseToFormValues(course: Course): CourseFormValues {
  return {
    title: course.title,
    description: course.description,
    category: course.category,
    subject: course.subject,
    teacherId: course.teacherId,
    price: String(course.price),
    visibility: course.visibility,
    availability: course.availability,
    publishNow: false,
  }
}