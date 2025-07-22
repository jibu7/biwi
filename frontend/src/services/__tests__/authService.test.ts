/**
 * @jest-environment jsdom
 */


import { authService } from '@/services/authService';
import * as axiosInstance from '@/lib/axiosInstance';
import * as authStore from '@/store/authStore';

jest.mock('@/lib/axiosInstance');
jest.mock('@/store/authStore');

describe('AuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should be defined', () => {
    expect(authService).toBeDefined()
  })

  it('should have login method', () => {
    expect(typeof authService.login).toBe('function')
  })

  it('should have logout method', () => {
    expect(typeof authService.logout).toBe('function')
  })

  it('should have platformLogin method', () => {
    expect(typeof authService.platformLogin).toBe('function')
  })

  it('should have getMe method', () => {
    expect(typeof authService.getMe).toBe('function')
  })

  describe('login method', () => {
    it('should call the correct endpoint with form data', async () => {
      const mockAxios = axiosInstance as jest.Mocked<any>;
      const mockResponse = { 
        data: { 
          access_token: 'test-token',
          token_type: 'bearer' 
        } 
      }
      mockAxios.post.mockResolvedValue(mockResponse)

      const credentials = {
        email: 'test@example.com',
        password: 'password123'
      }

      const result = await authService.login(credentials)

      expect(mockAxios.post).toHaveBeenCalledWith(
        '/auth/login',
        expect.any(FormData),
        { headers: { 'Content-Type': 'multipart/form-data' } }
      )
      expect(result).toEqual(mockResponse.data)
    })
  })
})
