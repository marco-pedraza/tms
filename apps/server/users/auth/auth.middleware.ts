// import { Context } from 'encore.dev/api';
// import { AuthenticationError, UnauthorizedError } from '../../shared/errors';
// import { userRepository } from '../users/users.repository';
// import { JwtPayload } from './auth.types';
// import { authUseCases } from './auth.use-cases';

// /**
//  * Middleware that validates the Authorization header contains a valid JWT
//  * and attaches the user information to the request context.
//  * 
//  * Usage: Add this middleware to any API endpoint that requires authentication
//  */
// export const requireAuth = {
//   middleware: async (ctx: Context) => {
//     const authHeader = ctx.req.header('Authorization');
    
//     if (!authHeader || !authHeader.startsWith('Bearer ')) {
//       throw new AuthenticationError('No valid authorization token provided');
//     }
    
//     const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
//     try {
//       // Verify the token
//       const decodedToken = await authUseCases.verifyAuthToken(token, 'access');
      
//       // Check if user exists and is active
//       const user = await userRepository.findOne(decodedToken.sub);
      
//       if (!user.isActive) {
//         throw new UnauthorizedError('User account is inactive');
//       }
      
//       // Attach user info to request context for use in controllers
//       ctx.data = {
//         ...ctx.data,
//         user,
//         tokenPayload: decodedToken,
//       };
      
//     } catch (error) {
//       if (error instanceof Error) {
//         throw new AuthenticationError(`Token validation failed: ${error.message}`);
//       }
//       throw new AuthenticationError('Token validation failed');
//     }
//   },
// };

// /**
//  * Middleware that checks if the authenticated user has system admin privileges
//  * Requires the requireAuth middleware to be applied first
//  */
// export const requireSystemAdmin = {
//   middleware: async (ctx: Context) => {
//     // The user should be attached by the requireAuth middleware
//     const { user, tokenPayload } = ctx.data as { 
//       user: { isSystemAdmin: boolean },
//       tokenPayload: JwtPayload
//     };
    
//     if (!user || !tokenPayload) {
//       throw new AuthenticationError('Authentication required');
//     }
    
//     if (!user.isSystemAdmin) {
//       throw new UnauthorizedError('System administrator privileges required');
//     }
//   },
// };
