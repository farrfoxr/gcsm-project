export default function SkeletonTable() {
  return (
    <div className="bg-white rounded-xl shadow-floating p-6 overflow-hidden">
      <div className="overflow-x-auto table-container">
        <table className="min-w-full">
          <thead>
            <tr className="border-b border-zinc-200">
              <th className="text-left py-4 px-6">
                <div className="h-4 bg-zinc-200 rounded shimmer"></div>
              </th>
              <th className="text-left py-4 px-6">
                <div className="h-4 bg-zinc-200 rounded shimmer"></div>
              </th>
              <th className="text-left py-4 px-6">
                <div className="h-4 bg-zinc-200 rounded shimmer"></div>
              </th>
              <th className="text-left py-4 px-6">
                <div className="h-4 bg-zinc-200 rounded shimmer"></div>
              </th>
              <th className="text-left py-4 px-6">
                <div className="h-4 bg-zinc-200 rounded shimmer"></div>
              </th>
              <th className="text-left py-4 px-6">
                <div className="h-4 bg-zinc-200 rounded shimmer"></div>
              </th>
              <th className="text-left py-4 px-6">
                <div className="h-4 bg-zinc-200 rounded shimmer"></div>
              </th>
            </tr>
          </thead>
          <tbody>
            {[...Array(5)].map((_, index) => (
              <tr key={index} className="border-b border-zinc-100 hover:bg-zinc-50">
                <td className="py-4 px-6">
                  <div className="space-y-2">
                    <div className="h-4 bg-zinc-200 rounded shimmer w-3/4"></div>
                    <div className="h-3 bg-zinc-200 rounded shimmer w-1/2"></div>
                  </div>
                </td>
                <td className="py-4 px-6">
                  <div className="h-5 bg-zinc-200 rounded shimmer w-24"></div>
                </td>
                <td className="py-4 px-6">
                  <div className="h-4 bg-zinc-200 rounded shimmer w-32"></div>
                </td>
                <td className="py-4 px-6">
                  <div className="h-4 bg-zinc-200 rounded shimmer w-20"></div>
                </td>
                <td className="py-4 px-6">
                  <div className="h-4 bg-zinc-200 rounded shimmer w-28"></div>
                </td>
                <td className="py-4 px-6">
                  <div className="flex gap-2">
                    <div className="h-6 bg-zinc-200 rounded-full shimmer w-16"></div>
                    <div className="h-6 bg-zinc-200 rounded-full shimmer w-20"></div>
                  </div>
                </td>
                <td className="py-4 px-6">
                  <div className="h-4 bg-zinc-200 rounded shimmer w-16"></div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}