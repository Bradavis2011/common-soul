import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import ServiceList from '../components/services/ServiceList'
import ServiceForm from '../components/services/ServiceForm'

function Services() {
  const { user } = useAuth()
  const [currentView, setCurrentView] = useState('list') // 'list', 'create', 'edit'
  const [editingService, setEditingService] = useState(null)

  const handleCreateNew = () => {
    setEditingService(null)
    setCurrentView('create')
  }

  const handleEdit = (service) => {
    setEditingService(service)
    setCurrentView('edit')
  }

  const handleSave = (savedService) => {
    // Service was saved successfully
    setCurrentView('list')
    setEditingService(null)
    // The ServiceList component will refetch services when it mounts
  }

  const handleCancel = () => {
    setCurrentView('list')
    setEditingService(null)
  }

  if (!user) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  if (user.userType !== 'HEALER') {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <div className="text-gray-400 text-6xl mb-4">🚫</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Restricted</h2>
        <p className="text-gray-600">
          Only healers can access service management. If you're a healer, please contact support.
        </p>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {currentView === 'list' && (
        <ServiceList 
          onCreateNew={handleCreateNew}
          onEdit={handleEdit}
        />
      )}
      
      {(currentView === 'create' || currentView === 'edit') && (
        <ServiceForm
          service={editingService}
          onSave={handleSave}
          onCancel={handleCancel}
        />
      )}
    </div>
  )
}

export default Services