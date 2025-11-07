/**
 * Vista Auth - Database Adapters
 * Pre-built adapters for common databases
 */

import type { DatabaseAdapter, User, Session } from "../types";

/**
 * Prisma Adapter
 * Works with any Prisma schema
 */
export function createPrismaAdapter(prisma: any): DatabaseAdapter {
  return {
    async findUserByEmail(email: string) {
      const user = await prisma.user.findUnique({ where: { email } });
      return user as User | null;
    },

    async findUserById(id: string) {
      const user = await prisma.user.findUnique({ where: { id } });
      return user as User | null;
    },

    async createUser(data: Partial<User>) {
      const user = await prisma.user.create({ data });
      return user as User;
    },

    async updateUser(id: string, data: Partial<User>) {
      const user = await prisma.user.update({ where: { id }, data });
      return user as User;
    },

    async deleteUser(id: string) {
      await prisma.user.delete({ where: { id } });
    },

    async createSession(userId: string, sessionData: any) {
      const session = await prisma.session.create({
        data: {
          id: sessionData.sessionId,
          userId,
          expiresAt: new Date(sessionData.expiresAt),
          data: sessionData,
        },
      });
      return sessionData as Session;
    },

    async getSession(sessionId: string) {
      const session = await prisma.session.findUnique({
        where: { id: sessionId },
      });
      return session?.data as Session | null;
    },

    async deleteSession(sessionId: string) {
      await prisma.session.delete({ where: { id: sessionId } });
    },

    async deleteUserSessions(userId: string) {
      await prisma.session.deleteMany({ where: { userId } });
    },
  };
}

/**
 * MongoDB Adapter
 * Works with MongoDB native driver or Mongoose
 */
export function createMongoAdapter(db: any): DatabaseAdapter {
  const users = db.collection("users");
  const sessions = db.collection("sessions");

  return {
    async findUserByEmail(email: string) {
      const user = await users.findOne({ email });
      return user ? { ...user, id: user._id.toString() } : null;
    },

    async findUserById(id: string) {
      const user = await users.findOne({ _id: id });
      return user ? { ...user, id: user._id.toString() } : null;
    },

    async createUser(data: Partial<User>) {
      const result = await users.insertOne(data);
      return { ...data, id: result.insertedId.toString() } as User;
    },

    async updateUser(id: string, data: Partial<User>) {
      await users.updateOne({ _id: id }, { $set: data });
      return { ...data, id } as User;
    },

    async deleteUser(id: string) {
      await users.deleteOne({ _id: id });
    },

    async createSession(userId: string, sessionData: any) {
      await sessions.insertOne({
        _id: sessionData.sessionId,
        userId,
        expiresAt: new Date(sessionData.expiresAt),
        data: sessionData,
      });
      return sessionData as Session;
    },

    async getSession(sessionId: string) {
      const session = await sessions.findOne({ _id: sessionId });
      return session?.data || null;
    },

    async deleteSession(sessionId: string) {
      await sessions.deleteOne({ _id: sessionId });
    },

    async deleteUserSessions(userId: string) {
      await sessions.deleteMany({ userId });
    },
  };
}

/**
 * Supabase Adapter
 */
export function createSupabaseAdapter(supabase: any): DatabaseAdapter {
  return {
    async findUserByEmail(email: string) {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("email", email)
        .single();
      return error ? null : data;
    },

    async findUserById(id: string) {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", id)
        .single();
      return error ? null : data;
    },

    async createUser(data: Partial<User>) {
      const { data: user, error } = await supabase
        .from("users")
        .insert(data)
        .select()
        .single();
      if (error) throw error;
      return user;
    },

    async updateUser(id: string, data: Partial<User>) {
      const { data: user, error } = await supabase
        .from("users")
        .update(data)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return user;
    },

    async deleteUser(id: string) {
      await supabase.from("users").delete().eq("id", id);
    },

    async createSession(userId: string, sessionData: any) {
      await supabase.from("sessions").insert({
        id: sessionData.sessionId,
        user_id: userId,
        expires_at: new Date(sessionData.expiresAt),
        data: sessionData,
      });
      return sessionData as Session;
    },

    async getSession(sessionId: string) {
      const { data } = await supabase
        .from("sessions")
        .select("data")
        .eq("id", sessionId)
        .single();
      return data?.data || null;
    },

    async deleteSession(sessionId: string) {
      await supabase.from("sessions").delete().eq("id", sessionId);
    },

    async deleteUserSessions(userId: string) {
      await supabase.from("sessions").delete().eq("user_id", userId);
    },
  };
}

/**
 * PostgreSQL Adapter (using pg library)
 */
export function createPostgresAdapter(pool: any): DatabaseAdapter {
  return {
    async findUserByEmail(email: string) {
      const result = await pool.query("SELECT * FROM users WHERE email = $1", [
        email,
      ]);
      return result.rows[0] || null;
    },

    async findUserById(id: string) {
      const result = await pool.query("SELECT * FROM users WHERE id = $1", [
        id,
      ]);
      return result.rows[0] || null;
    },

    async createUser(data: Partial<User>) {
      const result = await pool.query(
        "INSERT INTO users (id, email, name, roles, permissions, metadata) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
        [
          data.id,
          data.email,
          data.name,
          data.roles,
          data.permissions,
          data.metadata,
        ]
      );
      return result.rows[0];
    },

    async updateUser(id: string, data: Partial<User>) {
      const fields = Object.keys(data)
        .map((key, i) => `${key} = $${i + 2}`)
        .join(", ");
      const values = [id, ...Object.values(data)];
      const result = await pool.query(
        `UPDATE users SET ${fields} WHERE id = $1 RETURNING *`,
        values
      );
      return result.rows[0];
    },

    async deleteUser(id: string) {
      await pool.query("DELETE FROM users WHERE id = $1", [id]);
    },

    async createSession(userId: string, sessionData: any) {
      await pool.query(
        "INSERT INTO sessions (id, user_id, expires_at, data) VALUES ($1, $2, $3, $4)",
        [
          sessionData.sessionId,
          userId,
          new Date(sessionData.expiresAt),
          sessionData,
        ]
      );
      return sessionData as Session;
    },

    async getSession(sessionId: string) {
      const result = await pool.query(
        "SELECT data FROM sessions WHERE id = $1",
        [sessionId]
      );
      return result.rows[0]?.data || null;
    },

    async deleteSession(sessionId: string) {
      await pool.query("DELETE FROM sessions WHERE id = $1", [sessionId]);
    },

    async deleteUserSessions(userId: string) {
      await pool.query("DELETE FROM sessions WHERE user_id = $1", [userId]);
    },
  };
}

/**
 * Firebase Adapter
 */
export function createFirebaseAdapter(firestore: any): DatabaseAdapter {
  return {
    async findUserByEmail(email: string) {
      const snapshot = await firestore
        .collection("users")
        .where("email", "==", email)
        .get();
      if (snapshot.empty) return null;
      const doc = snapshot.docs[0];
      return { ...doc.data(), id: doc.id };
    },

    async findUserById(id: string) {
      const doc = await firestore.collection("users").doc(id).get();
      return doc.exists ? { ...doc.data(), id: doc.id } : null;
    },

    async createUser(data: Partial<User>) {
      const docRef = await firestore.collection("users").add(data);
      return { ...data, id: docRef.id } as User;
    },

    async updateUser(id: string, data: Partial<User>) {
      await firestore.collection("users").doc(id).update(data);
      return { ...data, id } as User;
    },

    async deleteUser(id: string) {
      await firestore.collection("users").doc(id).delete();
    },

    async createSession(userId: string, sessionData: any) {
      await firestore
        .collection("sessions")
        .doc(sessionData.sessionId)
        .set({
          userId,
          expiresAt: new Date(sessionData.expiresAt),
          data: sessionData,
        });
      return sessionData as Session;
    },

    async getSession(sessionId: string) {
      const doc = await firestore.collection("sessions").doc(sessionId).get();
      return doc.exists ? doc.data().data : null;
    },

    async deleteSession(sessionId: string) {
      await firestore.collection("sessions").doc(sessionId).delete();
    },

    async deleteUserSessions(userId: string) {
      const snapshot = await firestore
        .collection("sessions")
        .where("userId", "==", userId)
        .get();
      const batch = firestore.batch();
      snapshot.docs.forEach((doc: any) => batch.delete(doc.ref));
      await batch.commit();
    },
  };
}
