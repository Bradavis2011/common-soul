import { useState } from 'react'

const SERVICE_CATEGORIES = [
  { value: 'REIKI_HEALING', label: 'Reiki Healing' },
  { value: 'ENERGY_HEALING', label: 'Energy Healing' },
  { value: 'SPIRITUAL_COUNSELING', label: 'Spiritual Counseling' },
  { value: 'CHAKRA_ALIGNMENT', label: 'Chakra Alignment' },
  { value: 'TAROT_READING', label: 'Tarot Reading' },
  { value: 'MEDITATION_GUIDANCE', label: 'Meditation Guidance' },
  { value: 'CRYSTAL_HEALING', label: 'Crystal Healing' },
  { value: 'AURA_CLEANSING', label: 'Aura Cleansing' },
  { value: 'SOUND_HEALING', label: 'Sound Healing' },
  { value: 'BREATHWORK', label: 'Breathwork' },
  { value: 'ASTROLOGY', label: 'Astrology' },
  { value: 'NUMEROLOGY', label: 'Numerology' }
]

const PRICE_RANGES = [
  { value: '0-50', label: '$0 - $50' },
  { value: '51-100', label: '$51 - $100' },
  { value: '101-200', label: '$101 - $200' },
  { value: '201-500', label: '$201 - $500' },
  { value: '500+', label: '$500+' }
]

const DURATION_RANGES = [
  { value: '15-30', label: '15-30 minutes' },
  { value: '31-60', label: '31-60 minutes' },
  { value: '61-90', label: '61-90 minutes' },
  { value: '91-120', label: '91-120 minutes' },
  { value: '121+', label: '2+ hours' }
]

function ServiceFilter({ filters, onFiltersChange, onClear }) {
  const [isExpanded, setIsExpanded] = useState(false)

  const handleFilterChange = (key, value) => {
    onFiltersChange({
      ...filters,
      [key]: value
    })
  }

  const handleCategoryToggle = (category) => {
    const currentCategories = filters.categories || []
    const updatedCategories = currentCategories.includes(category)
      ? currentCategories.filter(c => c !== category)
      : [...currentCategories, category]
    
    handleFilterChange('categories', updatedCategories)
  }

  const hasActiveFilters = () => {
    return (filters.categories?.length > 0) || 
           filters.priceRange || 
           filters.durationRange || 
           filters.search
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Filter Services</h3>
        <div className="flex space-x-2">
          {hasActiveFilters() && (
            <button
              onClick={onClear}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Clear All
            </button>
          )}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-indigo-600 hover:text-indigo-700 text-sm font-medium"
          >
            {isExpanded ? 'Less Filters' : 'More Filters'}
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search services or healers..."
          value={filters.search || ''}
          onChange={(e) => handleFilterChange('search', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>

      {/* Quick Category Filters */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Categories
        </label>
        <div className="flex flex-wrap gap-2">
          {SERVICE_CATEGORIES.slice(0, 6).map(category => (
            <button
              key={category.value}
              onClick={() => handleCategoryToggle(category.value)}
              className={`px-3 py-1 rounded-full text-sm transition-colors ${
                filters.categories?.includes(category.value)
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {category.label}
            </button>
          ))}
        </div>
      </div>

      {/* Expanded Filters */}
      {isExpanded && (
        <div className="space-y-4 border-t border-gray-200 pt-4">
          {/* All Categories */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              All Categories
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {SERVICE_CATEGORIES.map(category => (
                <label key={category.value} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={filters.categories?.includes(category.value) || false}
                    onChange={() => handleCategoryToggle(category.value)}
                    className="mr-2 rounded text-indigo-600"
                  />
                  <span className="text-sm">{category.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Price Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Price Range
            </label>
            <select
              value={filters.priceRange || ''}
              onChange={(e) => handleFilterChange('priceRange', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">Any Price</option>
              {PRICE_RANGES.map(range => (
                <option key={range.value} value={range.value}>
                  {range.label}
                </option>
              ))}
            </select>
          </div>

          {/* Duration Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Session Duration
            </label>
            <select
              value={filters.durationRange || ''}
              onChange={(e) => handleFilterChange('durationRange', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">Any Duration</option>
              {DURATION_RANGES.map(range => (
                <option key={range.value} value={range.value}>
                  {range.label}
                </option>
              ))}
            </select>
          </div>

          {/* Sort Options */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sort By
            </label>
            <select
              value={filters.sortBy || 'newest'}
              onChange={(e) => handleFilterChange('sortBy', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="newest">Newest First</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="duration-short">Duration: Shortest First</option>
              <option value="duration-long">Duration: Longest First</option>
              <option value="popular">Most Popular</option>
            </select>
          </div>
        </div>
      )}
    </div>
  )
}

export default ServiceFilter