import { firebaseService } from '../services/firebase-service';

export const initializeSampleData = async (): Promise<void> => {
  try {
    console.log('🚀 Initializing sample data...');
    
    // Check if resources already exist
    const existingResources = await firebaseService.getResources();
    
    if (existingResources.length > 0) {
      console.log('✅ Sample data already exists:', existingResources.length, 'resources found');
      return;
    }
    
    console.log('📊 No existing resources found, creating sample data...');
    
    // Create sample resources
    const sampleResources = [
      {
        name: 'Computer Lab A',
        type: 'lab' as const,
        description: 'Fully equipped computer lab with 25 workstations, perfect for programming classes and group projects.',
        category: 'Laboratory',
        location: 'Building A, Room 101',
        capacity: 25,
        status: 'available' as const,
        isUnderMaintenance: false,
        maintenanceNote: '',
        features: ['Computers', 'Projector', 'Whiteboard', 'High-speed Internet'],
        equipment: ['25 Desktop Computers', 'HD Projector', 'Interactive Whiteboard', 'Network Printers'],
        maintenanceSchedule: 'Monthly'
      },
      {
        name: 'Conference Room B',
        type: 'room' as const,
        description: 'Professional conference room with presentation equipment, ideal for meetings and presentations.',
        category: 'Meeting Room',
        location: 'Building B, Room 205',
        capacity: 15,
        status: 'available' as const,
        isUnderMaintenance: false,
        maintenanceNote: '',
        features: ['Projector', 'Video Conference System', 'Whiteboard', 'Air Conditioning'],
        equipment: ['HD Projector', 'Video Conference System', 'Interactive Whiteboard', 'Sound System'],
        maintenanceSchedule: 'Quarterly'
      },
      {
        name: 'Science Lab',
        type: 'lab' as const,
        description: 'Advanced science laboratory with modern equipment for chemistry and biology experiments.',
        category: 'Laboratory',
        location: 'Building C, Room 301',
        capacity: 20,
        status: 'available' as const,
        isUnderMaintenance: false,
        maintenanceNote: '',
        features: ['Microscopes', 'Lab Equipment', 'Safety Gear', 'Fume Hoods'],
        equipment: ['Digital Microscopes', 'Lab Equipment', 'Safety Equipment', 'Chemical Storage'],
        maintenanceSchedule: 'Weekly'
      },
      {
        name: 'Library Study Room 1',
        type: 'room' as const,
        description: 'Quiet study room with individual desks and good lighting, perfect for focused studying.',
        category: 'Study Room',
        location: 'Library, Floor 2, Room 201',
        capacity: 8,
        status: 'available' as const,
        isUnderMaintenance: false,
        maintenanceNote: '',
        features: ['Individual Desks', 'Good Lighting', 'Quiet Environment', 'WiFi'],
        equipment: ['Study Desks', 'Chairs', 'Bookshelves', 'Power Outlets'],
        maintenanceSchedule: 'Monthly'
      },
      {
        name: 'Multimedia Studio',
        type: 'room' as const,
        description: 'Professional multimedia studio with recording equipment and editing stations.',
        category: 'Media Room',
        location: 'Building D, Room 105',
        capacity: 12,
        status: 'available' as const,
        isUnderMaintenance: false,
        maintenanceNote: '',
        features: ['Recording Equipment', 'Editing Stations', 'Soundproofing', 'Professional Lighting'],
        equipment: ['Audio Recording Equipment', 'Video Editing Stations', 'Professional Cameras', 'Lighting Equipment'],
        maintenanceSchedule: 'Monthly'
      }
    ];

    // Create each resource
    for (const resource of sampleResources) {
      try {
        await firebaseService.createResource(resource);
        console.log('✅ Created resource:', resource.name);
      } catch (error) {
        console.error('❌ Failed to create resource:', resource.name, error);
      }
    }

    console.log('🎉 Sample data initialization completed successfully!');
    
    // Create a sample notification for testing
    try {
      await firebaseService.createNotification({
        type: 'system_announcement',
        title: 'Welcome to Campus Resources Management System!',
        message: 'The system is now ready for use. You can start booking resources and managing your campus activities.',
        isRead: false,
        isSystemNotification: true,
        createdBy: 'System'
      });
      console.log('✅ Created welcome notification');
    } catch (error) {
      console.error('❌ Failed to create welcome notification:', error);
    }
    
  } catch (error) {
    console.error('❌ Error initializing sample data:', error);
    throw error;
  }
};

export const checkAndInitializeData = async (): Promise<boolean> => {
  try {
    const resources = await firebaseService.getResources();
    
    if (resources.length === 0) {
      console.log('📊 No resources found, initializing sample data...');
      await initializeSampleData();
      return true; // Data was initialized
    }
    
    console.log('✅ Resources already exist:', resources.length);
    return false; // Data already exists
  } catch (error) {
    console.error('❌ Error checking/initializing data:', error);
    return false;
  }
};
