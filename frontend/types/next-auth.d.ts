// types/next-auth.d.ts
import 'next-auth';

declare module 'next-auth' {
    /**
     * Represents the shape of the user object found within the session object.
     */
    interface User {
        id: string;
    }

    /**
     * Represents a session object returned from useSession, getSession, etc.
     */
    interface Session {
        user: User;
    }
}
