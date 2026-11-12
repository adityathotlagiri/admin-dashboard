import type {
  Paginated,
  Role,
  User,
  UserActivityItem,
  UserFormValues,
  UserQuery,
  UserStatus,
} from '../types'
import { delay } from './delay'

const firstNames = ['Aarav', 'Priya', 'Rahul', 'Ananya', 'Vikram', 'Neha', 'Rohan', 'Sneha', 'Karthik', 'Divya', 'Arjun', 'Meera']
const lastNames = ['Sharma', 'Verma', 'Rao', 'Reddy', 'Iyer', 'Nair', 'Patel', 'Singh', 'Gupta']

function buildUser(i: number): User {
  if (i === 0) {
    return {
      id: 'u-1',
      name: 'Super Admin',
      email: 'admin@edulearn.com',
      phone: '+91 90000 00001',
      role: 'admin',
      status: 'active',
      registeredAt: '2025-01-05T09:00:00.000Z',
      lastActive: '2026-11-11T08:30:00.000Z',
    }
  }

  const first = firstNames[i % firstNames.length]
  const last = lastNames[(i * 5) % lastNames.length]
  const role: Role = i % 10 === 0 ? 'admin' : i % 4 === 1 ? 'teacher' : 'student'
  const status: UserStatus = i % 13 === 6 ? 'suspended' : i % 9 === 4 ? 'inactive' : 'active'

  return {
    id: `u-${i + 1}`,
    name: `${first} ${last}`,
    email: `${first}.${last}${i + 1}@example.com`.toLowerCase(),
    phone: `+91 98${String(76500000 + i * 1357).padStart(8, '0')}`,
    role,
    status,
    registeredAt: new Date(Date.UTC(2025, i % 12, (i % 27) + 1, 10)).toISOString(),
    lastActive: new Date(Date.UTC(2026, 7 + (i % 3), (i % 27) + 1, 14)).toISOString(),
  }
}

const users: User[] = Array.from({ length: 48 }, (_, i) => buildUser(i))
const activityLog: Record<string, UserActivityItem[]> = {}
let nextId = users.length + 1

function logActivity(userId: string, action: string, detail: string) {
  const entry: UserActivityItem = {
    id: `act-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    action,
    detail,
    date: new Date().toISOString(),
  }
  activityLog[userId] = [entry, ...(activityLog[userId] ?? [])]
}

function findIndex(id: string) {
  const index = users.findIndex((u) => u.id === id)
  if (index === -1) throw new Error('User not found')
  return index
}

function assertEmailFree(email: string, ignoreId?: string) {
  const taken = users.some(
    (u) => u.email.toLowerCase() === email.trim().toLowerCase() && u.id !== ignoreId,
  )
  if (taken) throw new Error('A user with this email already exists')
}

export async function getUsers(query: UserQuery): Promise<Paginated<User>> {
  await delay(400)

  const term = query.search.trim().toLowerCase()

  const filtered = users.filter((u) => {
    const matchesSearch =
      !term || u.name.toLowerCase().includes(term) || u.email.toLowerCase().includes(term)
    const matchesRole = query.role === 'all' || u.role === query.role
    const matchesStatus = query.status === 'all' || u.status === query.status
    return matchesSearch && matchesRole && matchesStatus
  })

  const sorted = [...filtered].sort((a, b) => {
    const cmp = String(a[query.sortBy]).localeCompare(String(b[query.sortBy]))
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

export async function getUserById(id: string): Promise<User> {
  await delay(300)
  return users[findIndex(id)]
}

export async function getUserActivity(id: string): Promise<UserActivityItem[]> {
  await delay(400)
  const user = users[findIndex(id)]

  const base: UserActivityItem[] = [
    { id: `${id}-reg`, action: 'Registered', detail: 'Account created', date: user.registeredAt },
    { id: `${id}-login`, action: 'Last login', detail: 'Signed in from web', date: user.lastActive },
  ]

  return [...(activityLog[id] ?? []), ...base].sort((a, b) => b.date.localeCompare(a.date))
}

export async function createUser(values: UserFormValues): Promise<User> {
  await delay(600)
  assertEmailFree(values.email)

  const now = new Date().toISOString()
  const user: User = {
    id: `u-${nextId++}`,
    name: values.name.trim(),
    email: values.email.trim().toLowerCase(),
    phone: values.phone.trim(),
    role: values.role,
    status: 'active',
    registeredAt: now,
    lastActive: now,
  }

  users.unshift(user)
  logActivity(user.id, 'Account created', 'Added manually by an admin')
  return user
}

export async function updateUser(id: string, values: UserFormValues): Promise<User> {
  await delay(600)
  const index = findIndex(id)
  assertEmailFree(values.email, id)

  const previous = users[index]
  const updated: User = {
    ...previous,
    name: values.name.trim(),
    email: values.email.trim().toLowerCase(),
    phone: values.phone.trim(),
    role: values.role,
  }

  users[index] = updated
  logActivity(id, 'Profile updated', 'Details edited by an admin')
  if (previous.role !== updated.role) {
    logActivity(id, 'Role changed', `${previous.role} → ${updated.role}`)
  }
  return updated
}

export async function updateUserStatus(id: string, status: UserStatus): Promise<User> {
  await delay(500)
  const index = findIndex(id)
  const previous = users[index]

  users[index] = { ...previous, status }
  logActivity(id, 'Status changed', `${previous.status} → ${status}`)
  return users[index]
}

export async function updateUserRole(id: string, role: Role): Promise<User> {
  await delay(500)
  const index = findIndex(id)
  const previous = users[index]

  users[index] = { ...previous, role }
  logActivity(id, 'Role changed', `${previous.role} → ${role}`)
  return users[index]
}