// Example of how to integrate Supabase Auth with Express
import { supabase } from './server/supabase';
import type { Request, Response, NextFunction } from 'express';

// Middleware to check if user is authenticated
export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  // Get the JWT token from the Authorization header
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized - No token provided' });
  }
  
  try {
    // Verify the JWT token with Supabase
    const { data, error } = await supabase.auth.getUser(token);
    
    if (error || !data.user) {
      return res.status(401).json({ error: 'Unauthorized - Invalid token' });
    }
    
    // Attach the user to the request for use in route handlers
    (req as any).user = data.user;
    
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Unauthorized - Authentication failed' });
  }
};

// Example of how to use the middleware in routes
/*
app.get('/api/protected-route', requireAuth, (req, res) => {
  // Access the authenticated user
  const user = (req as any).user;
  
  // Your protected route logic here
  res.json({ message: `Hello, ${user.email}!` });
});
*/

// Example of a sign up function
export const signUp = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });
  
  if (error) throw error;
  return data;
};

// Example of a sign in function
export const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  
  if (error) throw error;
  return data;
};

// Example of a sign out function
export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

// Example of getting the current user
export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) throw error;
  return user;
};

// Example of updating a user's profile
export const updateProfile = async (profile: { first_name?: string; last_name?: string }) => {
  const { data, error } = await supabase.auth.updateUser({
    data: profile,
  });
  
  if (error) throw error;
  return data;
};