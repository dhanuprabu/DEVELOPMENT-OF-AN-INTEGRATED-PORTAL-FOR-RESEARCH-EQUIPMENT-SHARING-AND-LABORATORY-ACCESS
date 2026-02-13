
export enum UserRole {
  ADMIN = 'ADMIN',
  FACULTY = 'FACULTY',
  STUDENT = 'STUDENT'
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department: string;
}

export enum EquipmentStatus {
  AVAILABLE = 'AVAILABLE',
  IN_USE = 'IN_USE',
  MAINTENANCE = 'MAINTENANCE',
  BOOKED = 'BOOKED'
}

export interface Equipment {
  id: string;
  name: string;
  category: string;
  labName: string;
  status: EquipmentStatus;
  description: string;
  specifications: string[];
  hourlyRate: number;
  image: string;
  totalUsageHours: number;
}

export enum BookingStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

export interface Booking {
  id: string;
  equipmentId: string;
  userId: string;
  startTime: string;
  endTime: string;
  purpose: string;
  status: BookingStatus;
  requestedAt: string;
  facultyName: string;
  whatsappNumber: string;
  department: string;
}

export interface UtilizationData {
  month: string;
  usage: number;
  capacity: number;
}
