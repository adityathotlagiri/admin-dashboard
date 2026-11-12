import PageHeader from './PageHeader'

export default function ModulePlaceholder({ title }: { title: string }) {
  return (
    <div>
      <PageHeader title={title} description="This module will be built in an upcoming stage." />
      <div className="rounded-xl border border-dashed border-gray-300 bg-white py-20 text-center text-sm text-gray-400">
        Coming soon
      </div>
    </div>
  )
}