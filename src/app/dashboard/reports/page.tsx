import { Megaphone } from 'lucide-react'

export default function CampaignsPage() {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-3">
      <Megaphone className="w-8 h-8 text-gray-300" />
      <h1 className="text-2xl font-semibold text-gray-400">Campaigns</h1>
    </div>
  )
}
