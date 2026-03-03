# Design Document: Sistema de Consultas Vendedor-Artículo

## Overview

Este documento describe el diseño técnico de la capa de visualización para el sistema de consultas de vendedor-clientes y artículo-existencias. El sistema es una aplicación web desarrollada con Next.js 14+ que consume una API FastAPI existente, proporcionando una interfaz responsiva y moderna para consultas de información empresarial.

### Objetivos del Diseño

- Proporcionar una interfaz de usuario intuitiva y responsiva para consultas de datos
- Implementar autenticación segura mediante JWT tokens
- Crear componentes reutilizables siguiendo principios de diseño atómico
- Garantizar feedback visual claro en todos los estados de la aplicación
- Mantener separación clara entre lógica de presentación, estado y comunicación con API

### Tecnologías Principales

- **Framework**: Next.js 14+ con App Router
- **Lenguaje**: TypeScript para type safety
- **Estilos**: Tailwind CSS para diseño utility-first
- **Gestión de Estado**: React Context API para autenticación
- **HTTP Client**: Fetch API nativo con wrappers tipados
- **Autenticación**: JWT tokens almacenados en localStorage

## Architecture

### Arquitectura de Alto Nivel

El sistema sigue una arquitectura de tres capas:

```
┌─────────────────────────────────────────────────────────┐
│                    Presentation Layer                    │
│  (Next.js Pages/Components + Tailwind CSS)              │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│                   Application Layer                      │
│  (Context API, Custom Hooks, Business Logic)            │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│                   Integration Layer                      │
│  (API Client, Type Definitions, Error Handling)         │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│                   Backend API (FastAPI)                  │
└─────────────────────────────────────────────────────────┘
```

### Estructura de Directorios

```
src/
├── app/                          # Next.js App Router
│   ├── layout.tsx               # Root layout con providers
│   ├── page.tsx                 # Redirect a login
│   ├── login/
│   │   └── page.tsx            # Página de login
│   ├── dashboard/
│   │   └── page.tsx            # Dashboard principal
│   ├── vendedor/
│   │   └── page.tsx            # Consulta de vendedor
│   └── articulo/
│       └── page.tsx            # Consulta de artículo
├── components/
│   ├── ui/                      # Componentes base reutilizables
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Table.tsx
│   │   ├── Card.tsx
│   │   ├── Spinner.tsx
│   │   └── Skeleton.tsx
│   ├── layout/                  # Componentes de layout
│   │   ├── Header.tsx
│   │   └── ProtectedRoute.tsx
│   └── features/                # Componentes específicos de features
│       ├── LoginForm.tsx
│       ├── VendedorSearch.tsx
│       ├── ClientesTable.tsx
│       ├── ArticuloSearch.tsx
│       └── ArticuloDetail.tsx
├── contexts/
│   └── AuthContext.tsx          # Context para autenticación
├── lib/
│   ├── api/                     # Cliente API
│   │   ├── client.ts           # Configuración base del cliente
│   │   ├── auth.ts             # Endpoints de autenticación
│   │   ├── vendedor.ts         # Endpoints de vendedor
│   │   └── articulo.ts         # Endpoints de artículo
│   ├── types/                   # Definiciones de tipos
│   │   ├── auth.ts
│   │   ├── vendedor.ts
│   │   └── articulo.ts
│   └── utils/
│       ├── format.ts            # Utilidades de formateo
│       └── validation.ts        # Utilidades de validación
└── styles/
    └── globals.css              # Estilos globales y variables CSS
```

### Flujo de Navegación

```mermaid
graph TD
    A[/] --> B{Usuario autenticado?}
    B -->|No| C[/login]
    B -->|Sí| D[/dashboard]
    C -->|Login exitoso| D
    D --> E[/vendedor]
    D --> F[/articulo]
    E -->|Token expirado| C
    F -->|Token expirado| C
```

### Patrones de Diseño

1. **Compound Components**: Para componentes complejos como Table
2. **Custom Hooks**: Para lógica reutilizable (useAuth, useApi)
3. **Provider Pattern**: Para gestión de estado global (AuthContext)
4. **Presentational/Container**: Separación entre componentes de UI y lógica

## Components and Interfaces

### Componentes Base (UI Layer)

#### Button Component

```typescript
interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  className?: string;
}
```

Responsabilidades:
- Renderizar botón con estilos consistentes según variant y size
- Mostrar spinner cuando isLoading es true
- Deshabilitar interacción cuando disabled o isLoading

#### Input Component

```typescript
interface InputProps {
  label?: string;
  type?: 'text' | 'password' | 'email' | 'number';
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  icon?: React.ReactNode;
  disabled?: boolean;
  required?: boolean;
  className?: string;
}
```

Responsabilidades:
- Renderizar input con label y estilos consistentes
- Mostrar icono opcional a la izquierda
- Mostrar mensaje de error debajo del input
- Aplicar estilos de error cuando error está presente

#### Table Component

```typescript
interface Column<T> {
  key: keyof T | string;
  header: string;
  render?: (item: T) => React.ReactNode;
  className?: string;
}

interface TableProps<T> {
  data: T[];
  columns: Column<T>[];
  keyExtractor: (item: T) => string;
  emptyMessage?: string;
  className?: string;
}
```

Responsabilidades:
- Renderizar tabla con columnas configurables
- Aplicar zebra-striping automáticamente
- Mostrar mensaje cuando data está vacío
- Convertir a cards en viewport móvil

#### Card Component

```typescript
interface CardProps {
  children: React.ReactNode;
  title?: string;
  className?: string;
}
```

Responsabilidades:
- Renderizar contenedor con estilos de card
- Mostrar título opcional en header
- Proporcionar padding y sombra consistentes

#### Spinner Component

```typescript
interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}
```

Responsabilidades:
- Renderizar spinner animado
- Ajustar tamaño según prop size

#### Skeleton Component

```typescript
interface SkeletonProps {
  variant?: 'text' | 'rectangular' | 'circular';
  width?: string | number;
  height?: string | number;
  count?: number;
  className?: string;
}
```

Responsabilidades:
- Renderizar placeholder animado para contenido en carga
- Soportar múltiples variantes de forma
- Permitir repetición con count

### Componentes de Feature

#### LoginForm Component

```typescript
interface LoginFormProps {
  onSuccess: () => void;
}
```

Responsabilidades:
- Gestionar estado de formulario (username, password)
- Validar campos requeridos
- Llamar API de autenticación
- Almacenar token en AuthContext
- Mostrar errores de validación y autenticación
- Mostrar loading state durante autenticación

#### VendedorSearch Component

```typescript
interface VendedorSearchProps {
  onSearch: (codigo: string) => void;
  isLoading: boolean;
}
```

Responsabilidades:
- Gestionar input de código de vendedor
- Validar código no vacío
- Emitir evento onSearch con código válido
- Mostrar loading state en botón

#### ClientesTable Component

```typescript
interface ClientesTableProps {
  clientes: Cliente[];
  isLoading: boolean;
  error?: string;
}
```

Responsabilidades:
- Renderizar tabla de clientes usando Table component
- Formatear columna de saldo como moneda
- Mostrar skeleton durante carga
- Mostrar mensaje de error si existe
- Mostrar mensaje de empty state si no hay clientes

#### ArticuloSearch Component

```typescript
interface ArticuloSearchProps {
  onSearch: (codigo: string) => void;
  isLoading: boolean;
}
```

Responsabilidades:
- Gestionar input de código de artículo
- Validar código no vacío
- Emitir evento onSearch con código válido
- Mostrar loading state en botón

#### ArticuloDetail Component

```typescript
interface ArticuloDetailProps {
  articulo: Articulo;
  isLoading: boolean;
  error?: string;
}
```

Responsabilidades:
- Renderizar detalle de artículo con descripción y precio
- Formatear precio como moneda
- Renderizar grid de existencias por bodega
- Mostrar skeleton durante carga
- Mostrar mensaje de error si existe
- Adaptar layout a mobile

### Context y Hooks

#### AuthContext

```typescript
interface AuthContextValue {
  token: string | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  error: string | null;
}
```

Responsabilidades:
- Almacenar y gestionar token JWT
- Proporcionar estado de autenticación
- Exponer métodos login y logout
- Persistir token en localStorage
- Limpiar token al expirar

#### useAuth Hook

```typescript
function useAuth(): AuthContextValue
```

Responsabilidades:
- Proporcionar acceso al AuthContext
- Lanzar error si se usa fuera del provider

#### useApi Hook

```typescript
interface UseApiOptions<T> {
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
}

interface UseApiReturn<T, P extends any[]> {
  data: T | null;
  isLoading: boolean;
  error: string | null;
  execute: (...params: P) => Promise<void>;
  reset: () => void;
}

function useApi<T, P extends any[]>(
  apiFunction: (...params: P) => Promise<T>,
  options?: UseApiOptions<T>
): UseApiReturn<T, P>
```

Responsabilidades:
- Gestionar estado de llamadas API (data, loading, error)
- Ejecutar función API con manejo de errores
- Proporcionar método reset para limpiar estado
- Ejecutar callbacks onSuccess y onError

### API Client Layer

#### Base Client

```typescript
interface ApiConfig {
  baseURL: string;
  timeout?: number;
}

interface RequestOptions {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  body?: any;
  token?: string;
}

class ApiClient {
  constructor(config: ApiConfig);
  request<T>(endpoint: string, options: RequestOptions): Promise<T>;
}
```

Responsabilidades:
- Configurar base URL del backend
- Agregar token JWT a headers automáticamente
- Manejar errores HTTP y convertir a excepciones tipadas
- Parsear respuestas JSON
- Implementar timeout

#### Auth API

```typescript
interface LoginRequest {
  username: string;
  password: string;
}

interface LoginResponse {
  access_token: string;
  token_type: string;
}

async function login(credentials: LoginRequest): Promise<LoginResponse>
```

#### Vendedor API

```typescript
interface Cliente {
  nombre: string;
  ubicacion: string;
  saldo: number;
  zona: string;
}

interface VendedorResponse {
  vendedor_codigo: string;
  clientes: Cliente[];
}

async function getClientesByVendedor(codigo: string): Promise<VendedorResponse>
```

#### Articulo API

```typescript
interface Existencia {
  bodega: string;
  cantidad: number;
}

interface Articulo {
  codigo: string;
  descripcion: string;
  precio: number;
  existencias: Existencia[];
}

async function getArticulo(codigo: string): Promise<Articulo>
```

## Data Models

### Authentication Models

```typescript
// Token JWT almacenado en localStorage
interface StoredAuth {
  token: string;
  expiresAt: number; // timestamp
}

// Credenciales de login
interface LoginCredentials {
  username: string;
  password: string;
}

// Respuesta de autenticación
interface AuthResponse {
  access_token: string;
  token_type: string;
}
```

### Vendedor Models

```typescript
// Cliente asociado a vendedor
interface Cliente {
  nombre: string;
  ubicacion: string;
  saldo: number;
  zona: string;
}

// Respuesta de consulta de vendedor
interface VendedorQueryResponse {
  vendedor_codigo: string;
  clientes: Cliente[];
}

// Estado de búsqueda de vendedor
interface VendedorSearchState {
  codigo: string;
  clientes: Cliente[];
  isLoading: boolean;
  error: string | null;
}
```

### Articulo Models

```typescript
// Existencia en bodega
interface Existencia {
  bodega: string;
  cantidad: number;
}

// Artículo con existencias
interface Articulo {
  codigo: string;
  descripcion: string;
  precio: number;
  existencias: Existencia[];
}

// Estado de búsqueda de artículo
interface ArticuloSearchState {
  codigo: string;
  articulo: Articulo | null;
  isLoading: boolean;
  error: string | null;
}
```

### UI State Models

```typescript
// Estado de formulario genérico
interface FormState<T> {
  values: T;
  errors: Partial<Record<keyof T, string>>;
  touched: Partial<Record<keyof T, boolean>>;
  isSubmitting: boolean;
}

// Estado de API request genérico
interface ApiState<T> {
  data: T | null;
  isLoading: boolean;
  error: string | null;
}

// Configuración de validación
interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: any) => string | null;
}
```

### Design System Tokens

```typescript
// Colores del sistema
interface ColorTokens {
  primary: {
    50: string;
    100: string;
    // ... hasta 900
  };
  secondary: {
    50: string;
    // ...
  };
  error: string;
  success: string;
  warning: string;
  info: string;
}

// Breakpoints responsivos
interface Breakpoints {
  sm: '640px';
  md: '768px';
  lg: '1024px';
  xl: '1280px';
  '2xl': '1536px';
}

// Espaciado
interface Spacing {
  xs: '0.25rem';
  sm: '0.5rem';
  md: '1rem';
  lg: '1.5rem';
  xl: '2rem';
  '2xl': '3rem';
}
```


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Empty credentials validation

*For any* login attempt where username or password (or both) are empty or contain only whitespace, the system should display a validation error message and prevent submission.

**Validates: Requirements 1.2**

### Property 2: Valid credentials trigger API call

*For any* login attempt with non-empty username and password, the system should invoke the authentication API with those credentials.

**Validates: Requirements 1.3**

### Property 3: Successful authentication stores token and redirects

*For any* successful authentication response from the API, the system should store the JWT token in localStorage and redirect the user to the dashboard.

**Validates: Requirements 1.4**

### Property 4: Failed authentication displays error

*For any* authentication error response from the API, the system should display an error message indicating incorrect credentials.

**Validates: Requirements 1.5**

### Property 5: Loading state displays spinner

*For any* component in loading state (isLoading = true), the system should display a loading spinner or skeleton appropriate to the component type.

**Validates: Requirements 1.6, 3.5, 5.3, 8.1**

### Property 6: Unauthenticated access redirects to login

*For any* protected route, when accessed without a valid authentication token, the system should redirect to the login page.

**Validates: Requirements 2.1**

### Property 7: API requests include authentication token

*For any* API request to the backend, the system should include the JWT token in the Authorization header.

**Validates: Requirements 2.3**

### Property 8: Authentication errors clear token and redirect

*For any* API response with authentication error (401/403), the system should clear the stored token and redirect to the login page.

**Validates: Requirements 2.4**

### Property 9: Empty search code validation

*For any* search attempt in vendedor or articulo modules where the code is empty or contains only whitespace, the system should display a validation error and prevent the search.

**Validates: Requirements 3.3**

### Property 10: Valid search code triggers API call

*For any* search with a non-empty code in vendedor or articulo modules, the system should invoke the corresponding API endpoint with that code.

**Validates: Requirements 3.4, 5.2**

### Property 11: Successful data response displays results

*For any* successful API response containing data, the system should render the data in the appropriate format (table for clientes, detail view for articulo).

**Validates: Requirements 3.6, 5.4, 8.2**

### Property 12: API errors display error messages

*For any* API error response, the system should display a user-friendly error message describing the failure.

**Validates: Requirements 3.8, 5.6, 8.3**

### Property 13: Cliente table displays all required columns

*For any* list of clientes, the rendered table should include columns for Nombre Cliente, Ubicación, Saldo, and Zona.

**Validates: Requirements 4.1**

### Property 14: Numeric values format as currency

*For any* numeric value representing money (saldo, precio), the system should format it as currency with appropriate locale formatting (e.g., "$1,234.56").

**Validates: Requirements 4.2, 6.3**

### Property 15: Table rows have alternating styles

*For any* table with multiple rows, the system should apply alternating background colors (zebra-striping) to improve readability.

**Validates: Requirements 4.3**

### Property 16: Articulo detail displays description and price

*For any* articulo, the detail view should display both the description and price in the header section.

**Validates: Requirements 6.1, 6.2**

### Property 17: Existencias display all bodegas

*For any* articulo with existencias, the system should display the bodega name and quantity for each bodega in the existencias array.

**Validates: Requirements 6.4, 6.5**

### Property 18: Empty results display appropriate message

*For any* search query that returns no results, the system should display an empty state message appropriate to the context ("No se encontraron clientes" or "No se encontró el artículo").

**Validates: Requirements 3.7, 5.5, 8.4**

### Property 19: Skeleton loaders for table/card loading

*For any* table or card component in loading state, the system should display skeleton loaders rather than spinners.

**Validates: Requirements 8.5**

### Property 20: Spinners for button/form loading

*For any* button or form in loading state, the system should display a spinner indicator.

**Validates: Requirements 8.6**

### Property 21: Required field validation displays errors

*For any* required form field that is empty when validation is triggered, the system should display a validation error message below that field.

**Validates: Requirements 10.1**

### Property 22: Error correction removes error message

*For any* form field with a validation error, when the user corrects the input to be valid, the system should remove the error message.

**Validates: Requirements 10.2**

### Property 23: Invalid forms prevent submission

*For any* form with validation errors, the system should prevent form submission and highlight all fields with errors.

**Validates: Requirements 10.3**

### Property 24: Validation errors display clear messages

*For any* validation error, the system should display a clear, descriptive error message to help the user understand what needs to be corrected.

**Validates: Requirements 10.4**

### Property 25: Submit buttons disabled for invalid forms

*For any* form with required fields that are empty or invalid, the submit button should be disabled until all required fields are valid.

**Validates: Requirements 10.5**

## Error Handling

### Error Categories

El sistema maneja cuatro categorías principales de errores:

1. **Validation Errors**: Errores de validación de entrada del usuario
2. **Network Errors**: Errores de conectividad o timeout
3. **API Errors**: Errores retornados por el backend (4xx, 5xx)
4. **Authentication Errors**: Errores específicos de autenticación (401, 403)

### Error Handling Strategy

#### Validation Errors

```typescript
interface ValidationError {
  field: string;
  message: string;
}

// Manejo:
// - Mostrar mensaje debajo del campo afectado
// - Prevenir envío del formulario
// - Mantener el mensaje hasta que el usuario corrija el input
// - Color rojo para indicar error
```

#### Network Errors

```typescript
interface NetworkError {
  type: 'timeout' | 'offline' | 'unknown';
  message: string;
}

// Manejo:
// - Mostrar mensaje genérico: "Error de conexión. Por favor, verifica tu conexión a internet."
// - Proporcionar botón de "Reintentar"
// - No limpiar el formulario para permitir reintento
// - Logging en consola para debugging
```

#### API Errors

```typescript
interface ApiError {
  status: number;
  message: string;
  details?: any;
}

// Manejo por código de estado:
// - 400: Mostrar mensaje del backend o "Solicitud inválida"
// - 404: Mostrar "No se encontró el recurso solicitado"
// - 500: Mostrar "Error del servidor. Por favor, intenta más tarde"
// - Otros: Mostrar mensaje genérico con código de estado
// - Logging completo en consola para debugging
```

#### Authentication Errors

```typescript
interface AuthError {
  status: 401 | 403;
  message: string;
}

// Manejo:
// - 401: Limpiar token, redirigir a login, mostrar "Sesión expirada"
// - 403: Mostrar "No tienes permisos para esta acción"
// - Limpiar cualquier dato sensible del estado
// - Logging del evento para auditoría
```

### Error Boundary

Implementar Error Boundary de React para capturar errores no manejados:

```typescript
class ErrorBoundary extends React.Component {
  // Captura errores de renderizado
  // Muestra UI de fallback
  // Registra error para monitoreo
  // Proporciona botón para recargar la aplicación
}
```

### Error Display Components

```typescript
// Alert component para mostrar errores
interface AlertProps {
  type: 'error' | 'warning' | 'info' | 'success';
  message: string;
  onClose?: () => void;
}

// Toast component para notificaciones temporales
interface ToastProps {
  message: string;
  duration?: number;
  type: 'error' | 'success' | 'info';
}
```

### Retry Logic

Para errores de red, implementar retry con backoff exponencial:

```typescript
interface RetryConfig {
  maxRetries: 3;
  initialDelay: 1000; // ms
  maxDelay: 10000; // ms
  backoffMultiplier: 2;
}

// Aplicar solo a errores de red, no a errores de validación o 4xx
```

## Testing Strategy

### Overview

El sistema utiliza una estrategia de testing dual que combina unit tests para casos específicos y property-based tests para verificar propiedades universales. Esta aproximación garantiza tanto la corrección de casos concretos como el comportamiento general del sistema.

### Testing Stack

- **Test Runner**: Vitest (compatible con Vite/Next.js)
- **Testing Library**: React Testing Library para componentes
- **Property-Based Testing**: fast-check (JavaScript/TypeScript PBT library)
- **Mocking**: vitest mocks para API calls
- **Coverage**: vitest coverage con threshold mínimo de 80%

### Unit Testing Approach

Los unit tests se enfocan en:

1. **Casos específicos de ejemplo**: Verificar comportamientos concretos documentados
2. **Edge cases**: Casos límite como strings vacíos, arrays vacíos, valores nulos
3. **Integración de componentes**: Verificar que componentes padres e hijos interactúan correctamente
4. **Comportamiento de UI**: Verificar que eventos de usuario producen los efectos esperados

**Ejemplos de unit tests**:

```typescript
// Ejemplo: Login form muestra campos requeridos
test('login form displays username and password fields with icons', () => {
  render(<LoginForm onSuccess={jest.fn()} />);
  expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
  expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
  expect(screen.getByTestId('username-icon')).toBeInTheDocument();
  expect(screen.getByTestId('password-icon')).toBeInTheDocument();
});

// Ejemplo: Empty state message específico
test('vendedor search shows specific message when no clients found', () => {
  render(<ClientesTable clientes={[]} isLoading={false} />);
  expect(screen.getByText('No se encontraron clientes para este vendedor')).toBeInTheDocument();
});

// Ejemplo: Token expirado redirige a login
test('expired token redirects to login page', () => {
  const expiredToken = generateExpiredToken();
  localStorage.setItem('auth_token', expiredToken);
  render(<ProtectedRoute><Dashboard /></ProtectedRoute>);
  expect(mockRouter.push).toHaveBeenCalledWith('/login');
});
```

### Property-Based Testing Approach

Los property tests verifican propiedades universales que deben cumplirse para todos los inputs válidos. Cada test ejecuta mínimo 100 iteraciones con datos generados aleatoriamente.

**Configuración de fast-check**:

```typescript
import fc from 'fast-check';

// Configuración global
const testConfig = {
  numRuns: 100, // Mínimo requerido
  verbose: true,
  seed: Date.now(), // Para reproducibilidad
};
```

**Generadores personalizados**:

```typescript
// Generador de clientes
const clienteArbitrary = fc.record({
  nombre: fc.string({ minLength: 1, maxLength: 100 }),
  ubicacion: fc.string({ minLength: 1, maxLength: 200 }),
  saldo: fc.float({ min: -1000000, max: 1000000 }),
  zona: fc.string({ minLength: 1, maxLength: 50 }),
});

// Generador de artículos
const articuloArbitrary = fc.record({
  codigo: fc.string({ minLength: 1, maxLength: 20 }),
  descripcion: fc.string({ minLength: 1, maxLength: 200 }),
  precio: fc.float({ min: 0, max: 1000000 }),
  existencias: fc.array(fc.record({
    bodega: fc.string({ minLength: 1, maxLength: 50 }),
    cantidad: fc.integer({ min: 0, max: 10000 }),
  })),
});

// Generador de credenciales vacías
const emptyCredentialsArbitrary = fc.record({
  username: fc.constantFrom('', '   ', '\t\n'),
  password: fc.constantFrom('', '   ', '\t\n'),
}).filter(cred => cred.username.trim() === '' || cred.password.trim() === '');
```

**Ejemplos de property tests**:

```typescript
// Feature: sistema-consultas-vendedor-articulo, Property 1: Empty credentials validation
test('property: empty credentials always show validation error', () => {
  fc.assert(
    fc.property(emptyCredentialsArbitrary, (credentials) => {
      const { container } = render(<LoginForm onSuccess={jest.fn()} />);
      
      fireEvent.change(screen.getByLabelText(/username/i), {
        target: { value: credentials.username }
      });
      fireEvent.change(screen.getByLabelText(/password/i), {
        target: { value: credentials.password }
      });
      fireEvent.click(screen.getByRole('button', { name: /login/i }));
      
      const errorMessage = screen.queryByText(/required|empty|invalid/i);
      return errorMessage !== null;
    }),
    testConfig
  );
});

// Feature: sistema-consultas-vendedor-articulo, Property 14: Numeric values format as currency
test('property: all numeric money values format as currency', () => {
  fc.assert(
    fc.property(fc.float({ min: -1000000, max: 1000000 }), (amount) => {
      const formatted = formatCurrency(amount);
      
      // Verificar que contiene símbolo de moneda
      const hasCurrencySymbol = /[$€£¥]/.test(formatted);
      // Verificar que usa separadores de miles
      const hasThousandsSeparator = amount >= 1000 ? /[,.]/.test(formatted) : true;
      // Verificar que tiene decimales
      const hasDecimals = /\.\d{2}$/.test(formatted);
      
      return hasCurrencySymbol && hasThousandsSeparator && hasDecimals;
    }),
    testConfig
  );
});

// Feature: sistema-consultas-vendedor-articulo, Property 13: Cliente table displays all required columns
test('property: cliente table always shows all required columns', () => {
  fc.assert(
    fc.property(fc.array(clienteArbitrary, { minLength: 1 }), (clientes) => {
      render(<ClientesTable clientes={clientes} isLoading={false} />);
      
      const hasNombreColumn = screen.getByText(/nombre cliente/i) !== null;
      const hasUbicacionColumn = screen.getByText(/ubicación/i) !== null;
      const hasSaldoColumn = screen.getByText(/saldo/i) !== null;
      const hasZonaColumn = screen.getByText(/zona/i) !== null;
      
      return hasNombreColumn && hasUbicacionColumn && hasSaldoColumn && hasZonaColumn;
    }),
    testConfig
  );
});

// Feature: sistema-consultas-vendedor-articulo, Property 15: Table rows have alternating styles
test('property: table rows always have zebra-striping', () => {
  fc.assert(
    fc.property(fc.array(clienteArbitrary, { minLength: 2, maxLength: 10 }), (clientes) => {
      const { container } = render(<ClientesTable clientes={clientes} isLoading={false} />);
      
      const rows = container.querySelectorAll('tbody tr');
      let hasAlternatingStyles = true;
      
      for (let i = 0; i < rows.length - 1; i++) {
        const currentClass = rows[i].className;
        const nextClass = rows[i + 1].className;
        // Verificar que clases son diferentes (alternancia)
        if (currentClass === nextClass) {
          hasAlternatingStyles = false;
          break;
        }
      }
      
      return hasAlternatingStyles;
    }),
    testConfig
  );
});

// Feature: sistema-consultas-vendedor-articulo, Property 17: Existencias display all bodegas
test('property: articulo detail shows all bodegas from existencias', () => {
  fc.assert(
    fc.property(articuloArbitrary, (articulo) => {
      render(<ArticuloDetail articulo={articulo} isLoading={false} />);
      
      // Verificar que cada bodega aparece en el DOM
      const allBodegasDisplayed = articulo.existencias.every(existencia => {
        const bodegaElement = screen.queryByText(new RegExp(existencia.bodega, 'i'));
        const cantidadElement = screen.queryByText(new RegExp(existencia.cantidad.toString(), 'i'));
        return bodegaElement !== null && cantidadElement !== null;
      });
      
      return allBodegasDisplayed;
    }),
    testConfig
  );
});
```

### Test Organization

```
src/
├── components/
│   ├── ui/
│   │   ├── Button.tsx
│   │   ├── Button.test.tsx          # Unit tests
│   │   ├── Button.properties.test.tsx  # Property tests
│   │   └── ...
│   └── features/
│       ├── LoginForm.tsx
│       ├── LoginForm.test.tsx
│       ├── LoginForm.properties.test.tsx
│       └── ...
├── lib/
│   ├── api/
│   │   ├── client.test.ts
│   │   └── ...
│   └── utils/
│       ├── format.test.ts
│       ├── format.properties.test.ts
│       └── ...
└── __tests__/
    ├── integration/                 # Integration tests
    └── generators/                  # fast-check generators compartidos
        ├── cliente.ts
        ├── articulo.ts
        └── auth.ts
```

### Coverage Requirements

- **Mínimo global**: 80% de cobertura
- **Componentes críticos** (auth, API client): 90% de cobertura
- **Componentes UI base**: 85% de cobertura
- **Utilities**: 95% de cobertura

### Testing Commands

```bash
# Ejecutar todos los tests
npm run test

# Ejecutar solo unit tests
npm run test:unit

# Ejecutar solo property tests
npm run test:properties

# Ejecutar con coverage
npm run test:coverage

# Ejecutar en modo watch
npm run test:watch

# Ejecutar tests específicos
npm run test -- LoginForm
```

### Mocking Strategy

**API Mocking**:
```typescript
// Mock del API client
vi.mock('@/lib/api/client', () => ({
  apiClient: {
    request: vi.fn(),
  },
}));

// Mock de respuestas exitosas
mockApiClient.request.mockResolvedValue({
  data: mockData,
  status: 200,
});

// Mock de errores
mockApiClient.request.mockRejectedValue({
  status: 401,
  message: 'Unauthorized',
});
```

**Router Mocking**:
```typescript
// Mock de Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
  }),
}));
```

**LocalStorage Mocking**:
```typescript
// Mock de localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
global.localStorage = localStorageMock as any;
```

### Continuous Integration

Los tests deben ejecutarse en CI/CD pipeline:

1. **Pre-commit**: Ejecutar tests de archivos modificados
2. **Pull Request**: Ejecutar suite completa de tests
3. **Pre-deploy**: Ejecutar tests + verificar coverage mínimo
4. **Post-deploy**: Ejecutar smoke tests en ambiente de staging

### Test Maintenance

- Revisar y actualizar generadores cuando cambien los modelos de datos
- Mantener tests sincronizados con cambios en requirements
- Documentar casos edge descubiertos por property tests
- Refactorizar tests duplicados o redundantes
- Mantener tiempo de ejecución de suite completa bajo 2 minutos

