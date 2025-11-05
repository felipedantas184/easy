export default function StoreLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Loading */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4">
          <div className="h-16 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-32 h-8 bg-gray-200 rounded animate-pulse"></div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="w-20 h-10 bg-gray-200 rounded animate-pulse"></div>
              <div className="w-20 h-10 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Hero Loading */}
      <div className="bg-white">
        <div className="container mx-auto px-4 py-12">
          <div className="text-center max-w-2xl mx-auto">
            <div className="w-3/4 h-8 bg-gray-200 rounded animate-pulse mx-auto mb-4"></div>
            <div className="w-full h-4 bg-gray-200 rounded animate-pulse mb-2"></div>
            <div className="w-2/3 h-4 bg-gray-200 rounded animate-pulse mx-auto"></div>
          </div>
        </div>
      </div>

      {/* Products Grid Loading */}
      <div className="container mx-auto px-4 py-8">
        <div className="w-48 h-6 bg-gray-200 rounded animate-pulse mb-6"></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="bg-white rounded-lg border animate-pulse">
              <div className="aspect-square bg-gray-200 rounded-t-lg"></div>
              <div className="p-4">
                <div className="w-3/4 h-4 bg-gray-200 rounded mb-2"></div>
                <div className="w-1/2 h-4 bg-gray-200 rounded mb-3"></div>
                <div className="w-1/3 h-6 bg-gray-200 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}