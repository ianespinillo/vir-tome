import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ROLES } from '@repo/common'; // Asumo que ROLES es un enum de cadena
import { In, Repository } from 'typeorm';
import { RoleEntity } from '../entities/role.entity'; // Asumo la ruta
import { RoleService } from './role.service'; // Asumo la ruta

// Mock de la entidad RoleEntity para usar en los tests
const mockRole: RoleEntity = {
	id: 1,
	name: ROLES.ADMIN,
	tenant_id: 101,
	created_at: new Date(),
	updated_at: new Date(),
} as RoleEntity;

// Mock del enum ROLES (si no está disponible globalmente en el entorno de prueba)
// En un caso real, `@repo/common` debería estar disponible o mockeado de forma global.
// Para este ejemplo, asumimos que ROLES es algo como:
/*
export enum ROLES {
    ADMIN = 'ADMIN',
    LIBRARIAN = 'LIBRARIAN',
    TEACHER = 'TEACHER',
    STUDENT = 'STUDENT',
}
*/

describe('RoleService', () => {
	let service: RoleService;
	let roleRepository: Repository<RoleEntity>;

	// Mock del RoleRepository con las funciones de TypeORM que usamos
	const mockRoleRepository = {
		findOne: jest.fn(),
		save: jest.fn(),
		find: jest.fn(),
	};

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				RoleService,
				{
					provide: getRepositoryToken(RoleEntity),
					useValue: mockRoleRepository,
				},
			],
		}).compile();

		service = module.get<RoleService>(RoleService);
		// Cast necesario para TypeMoq/Jest Mocks
		roleRepository = module.get<Repository<RoleEntity>>(
			getRepositoryToken(RoleEntity),
		);
	});

	afterEach(() => {
		// Limpia todos los mocks después de cada prueba
		jest.clearAllMocks();
	});

	it('should be defined', () => {
		expect(service).toBeDefined();
	});

	// --- Tests para findRoleByName ---
	describe('findRoleByName', () => {
		const name = ROLES.ADMIN;
		const tenantId = 101;

		it('should return a role if found', async () => {
			mockRoleRepository.findOne.mockResolvedValue(mockRole);

			const result = await service.findRoleByName(name, tenantId);

			expect(result).toEqual(mockRole);
			expect(mockRoleRepository.findOne).toHaveBeenCalledWith({
				where: { name: name, tenant_id: tenantId },
			});
		});

		it('should return null if role is not found', async () => {
			mockRoleRepository.findOne.mockResolvedValue(null);

			const result = await service.findRoleByName(name, tenantId);

			expect(result).toBeNull();
		});

		it('should throw BadRequestException for an invalid role name', async () => {
			const invalidName = 'INVALID_ROLE';

			await expect(service.findRoleByName(invalidName, tenantId)).rejects.toThrow(
				new BadRequestException('Invalid role name'),
			);
			// Aseguramos que la base de datos no fue consultada
			expect(mockRoleRepository.findOne).not.toHaveBeenCalled();
		});
	});

	// --- Tests para createRole ---
	describe('createRole', () => {
		const name = ROLES.LIBRARIAN;
		const tenantId = 101;

		it('should successfully create and return a new role', async () => {
			// 1. findRoleByName debe devolver null (no existe)
			mockRoleRepository.findOne.mockResolvedValue(null);
			// 2. save debe devolver la entidad creada
			mockRoleRepository.save.mockResolvedValue({ ...mockRole, name: name });

			const result = await service.createRole(name, tenantId);

			expect(result.name).toBe(name);
			expect(result.tenant_id).toBe(tenantId);
			expect(mockRoleRepository.findOne).toHaveBeenCalledTimes(1);
			expect(mockRoleRepository.save).toHaveBeenCalledWith({
				name: name,
				tenant_id: tenantId,
			});
		});

		it('should throw BadRequestException if role already exists', async () => {
			// findRoleByName debe devolver la entidad (existe)
			mockRoleRepository.findOne.mockResolvedValue(mockRole);

			await expect(service.createRole(name, tenantId)).rejects.toThrow(
				new BadRequestException('Role already exists'),
			);
			// Aseguramos que save no fue llamado
			expect(mockRoleRepository.save).not.toHaveBeenCalled();
		});

		it('should handle and re-throw TypeORM save errors as BadRequestException', async () => {
			// findRoleByName debe devolver null (no existe)
			mockRoleRepository.findOne.mockResolvedValue(null);
			// Simula un error de DB (ej. violación de restricción)
			const dbError = new Error('DB connection failed');
			mockRoleRepository.save.mockRejectedValue(dbError);

			await expect(service.createRole(name, tenantId)).rejects.toThrow(
				new BadRequestException(dbError.message),
			);
		});

		it('should re-throw non-Error exceptions from save', async () => {
			// findRoleByName debe devolver null (no existe)
			mockRoleRepository.findOne.mockResolvedValue(null);
			const unknownError = new Error('Unknown exception'); // No es instancia de Error
			mockRoleRepository.save.mockRejectedValue(unknownError);

			await expect(service.createRole(name, tenantId)).rejects.toThrow(
				unknownError,
			);
		});
	});

	// --- Tests para findAllRoles ---
	describe('findAllRoles', () => {
		const tenantId = 101;
		const allRolesMock = [mockRole, { ...mockRole, id: 2, name: ROLES.STUDENT }];

		it('should return all roles for a given tenantId', async () => {
			mockRoleRepository.find.mockResolvedValue(allRolesMock);

			const result = await service.findAllRoles(tenantId);

			expect(result).toEqual(allRolesMock);
			expect(mockRoleRepository.find).toHaveBeenCalledWith({
				where: { tenant_id: tenantId },
			});
		});
	});

	// --- Tests para getDefaultRoles ---
	describe('getDefaultRoles', () => {
		const tenantId = 101;
		const defaultRoleNames = [
			ROLES.ADMIN,
			ROLES.LIBRARIAN,
			ROLES.TEACHER,
			ROLES.STUDENT,
		];
		const defaultRolesMock = [
			{ ...mockRole, name: ROLES.ADMIN },
			{ ...mockRole, id: 2, name: ROLES.STUDENT },
		];

		it('should find all default roles for a given tenantId', async () => {
			mockRoleRepository.find.mockResolvedValue(defaultRolesMock);

			const result = await service.getDefaultRoles(tenantId);

			expect(result).toEqual(defaultRolesMock);
			expect(mockRoleRepository.find).toHaveBeenCalledWith({
				where: {
					tenant_id: tenantId,
					name: In(defaultRoleNames), // TypeORM's 'In' operator
				},
			});
		});
	});

	// --- Tests para initializeDefaultRoles ---
	describe('initializeDefaultRoles', () => {
		const tenantId = 101;
		const defaultRoles = [
			ROLES.ADMIN,
			ROLES.LIBRARIAN,
			ROLES.TEACHER,
			ROLES.STUDENT,
		];

		// Mock de las entidades de roles por defecto (con IDs incrementales)
		const createdRolesMock = defaultRoles.map((name, index) => ({
			...mockRole,
			id: index + 1,
			name: name,
		}));

		it('should successfully create all default roles if they do not exist', async () => {
			// findRoleByName (llamado internamente por createRole) debe devolver null para todos
			// Configuramos un mock que devuelve `null` en la primera llamada (findRoleByName)
			mockRoleRepository.findOne.mockResolvedValue(null);

			// Configuramos mockRoleRepository.save para que devuelva la entidad creada
			// Usamos un mock de implementación para simular que save devuelve el objeto correcto
			mockRoleRepository.save.mockImplementation(async (roleData) => {
				const index = defaultRoles.indexOf(roleData.name);
				return createdRolesMock[index];
			});

			const result = await service.initializeDefaultRoles(tenantId);

			// Deben haberse llamado 4 veces a findOne (en createRole)
			expect(mockRoleRepository.findOne).toHaveBeenCalledTimes(4);
			// Deben haberse llamado 4 veces a save
			expect(mockRoleRepository.save).toHaveBeenCalledTimes(4);
			// El resultado debe contener 4 roles
			expect(result).toHaveLength(4);
			// Verificamos que los nombres coincidan
			expect(result.map((r) => r.name)).toEqual(defaultRoles);
		});

		it('should return existing roles and create non-existing ones', async () => {
			const existingAdminRole = { ...mockRole, id: 1, name: ROLES.ADMIN };
			const existingLibrarianRole = { ...mockRole, id: 2, name: ROLES.LIBRARIAN };
			const newTeacherRole = { ...mockRole, id: 3, name: ROLES.TEACHER };
			const newStudentRole = { ...mockRole, id: 4, name: ROLES.STUDENT };

			// Simula que ADMIN y LIBRARIAN ya existen
			// RoleService.createRole llama a findRoleByName.
			// Si findRoleByName retorna un valor, createRole lanza BadRequestException.

			// Mapeo de roles para simular el comportamiento:
			// 1. ADMIN: findRoleByName retorna existingAdminRole -> createRole lanza 'Role already exists'
			// 2. LIBRARIAN: findRoleByName retorna existingLibrarianRole -> createRole lanza 'Role already exists'
			// 3. TEACHER: findRoleByName retorna null -> createRole llama save.
			// 4. STUDENT: findRoleByName retorna null -> createRole llama save.

			// Contador para simular qué rol existe/no existe
			let findOneCallCount = 0;
			mockRoleRepository.findOne.mockImplementation(
				async ({ where: { name } }: any) => {
					findOneCallCount++;
					if (name === ROLES.ADMIN) return existingAdminRole;
					if (name === ROLES.LIBRARIAN) return existingLibrarianRole;
					return null; // TEACHER y STUDENT no existen
				},
			);

			// Simulamos el resultado de save solo para TEACHER y STUDENT
			mockRoleRepository.save.mockImplementation(async ({ name }: any) => {
				if (name === ROLES.TEACHER) return newTeacherRole;
				if (name === ROLES.STUDENT) return newStudentRole;
				return {} as RoleEntity; // Fallback
			});

			// Simulamos el comportamiento del catch para los que ya existen
			// Cuando createRole falla con BadRequestException, llama a findRoleByName de nuevo
			// para obtener el rol existente.

			const result = await service.initializeDefaultRoles(tenantId);

			// Deberíamos haber llamado a findOne 4 veces inicialmente (en createRole).
			// Luego, dos veces más en el bloque `catch` para ADMIN y LIBRARIAN. Total: 6 veces.
			expect(mockRoleRepository.findOne).toHaveBeenCalledTimes(6);
			// Se debe llamar a save solo 2 veces (TEACHER y STUDENT)
			expect(mockRoleRepository.save).toHaveBeenCalledTimes(2);

			expect(result).toHaveLength(4);
			expect(result).toEqual(
				expect.arrayContaining([
					existingAdminRole,
					existingLibrarianRole,
					newTeacherRole,
					newStudentRole,
				]),
			);
		});

		it('should handle and ignore other errors in role creation loop', async () => {
			const existingAdminRole = { ...mockRole, id: 1, name: ROLES.ADMIN };
			const newLibrarianRole = { ...mockRole, id: 2, name: ROLES.LIBRARIAN };

			// Simula el escenario:
			// 1. ADMIN: Exists (BadRequestException), luego buscado y encontrado.
			// 2. LIBRARIAN: Doesn't exist, created successfully.
			// 3. TEACHER: Fails with a non-BadRequestException (error de DB).
			// 4. STUDENT: Doesn't exist, created successfully.

			mockRoleRepository.findOne.mockImplementation(
				async ({ where: { name } }: any) => {
					if (name === ROLES.ADMIN) return existingAdminRole;
					return null;
				},
			);

			let saveCallCount = 0;
			mockRoleRepository.save.mockImplementation(async ({ name }: any) => {
				saveCallCount++;
				if (name === ROLES.TEACHER) {
					throw new Error('Some non-BadRequest DB error');
				}
				if (name === ROLES.LIBRARIAN) return newLibrarianRole;
				if (name === ROLES.STUDENT)
					return { ...mockRole, id: 4, name: ROLES.STUDENT };
				return {} as RoleEntity;
			});

			const result = await service.initializeDefaultRoles(tenantId);

			// Se crean 3 roles, 1 falla y 1 existe. Total de retorno: 3.
			expect(result).toHaveLength(3);
			expect(result.map((r) => r.name)).toEqual([
				ROLES.ADMIN, // Existed
				ROLES.LIBRARIAN, // Created
				ROLES.STUDENT, // Created
			]);
			// El rol TEACHER se ignora debido a que el error no es BadRequestException
			expect(result.map((r) => r.name)).not.toContain(ROLES.TEACHER);
		});
	});
});
