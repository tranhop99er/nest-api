import { DeepMocked, createMock } from '@golevelup/ts-jest'
import { ExecutionContext } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { Reflector } from '@nestjs/core'
import { Test } from '@nestjs/testing'
import { Role } from '@prisma/client'
import { AuthorizationGuard } from './authorization.guard'

describe('Authorization Guard', () => {
  let authorizationGuard: AuthorizationGuard
  let reflector: Reflector
  let context: DeepMocked<ExecutionContext>
  let request: jest.Mock

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      imports: [ConfigModule.forRoot()],
      providers: [AuthorizationGuard, Reflector]
    }).compile()
    authorizationGuard = module.get<AuthorizationGuard>(AuthorizationGuard)
    reflector = module.get<Reflector>(Reflector)
    context = createMock<ExecutionContext>()
    request = context.switchToHttp().getRequest as jest.Mock
  })

  it('should be defined', () => {
    expect(authorizationGuard).toBeDefined()
  })

  it('should return true if public', async () => {
    reflector.getAllAndOverride = jest.fn().mockReturnValue(undefined)

    const result = await authorizationGuard.canActivate(context)
    expect(result).toBe(true)
  })

  it('should return true if correct role', async () => {
    reflector.getAllAndOverride = jest.fn().mockReturnValue([Role.USER])

    request.mockReturnValue({
      user: {
        role: Role.USER
      }
    })

    const result = await authorizationGuard.canActivate(context)
    expect(result).toBe(true)
  })

  it('should return false if incorrect role', async () => {
    reflector.getAllAndOverride = jest.fn().mockReturnValue([Role.SYSTEM_ADMIN])

    request.mockReturnValue({
      user: {
        role: Role.USER
      }
    })

    const result = await authorizationGuard.canActivate(context)
    expect(result).toBe(false)
  })
})
