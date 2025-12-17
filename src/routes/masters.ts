import { Elysia, t } from 'elysia';
import { db } from '../db';
import { masterOptions } from '../db/schema';
import { eq } from 'drizzle-orm';

export const masterRoutes = new Elysia({ prefix: '/api/masters' })
  .get('/', async () => {
    const result = await db.select().from(masterOptions);
    return result;
  })
  .post('/', async ({ body, set }) => {
    try {
      const result = await db.insert(masterOptions).values(body).returning();
      return result[0];
    } catch (error) {
      set.status = 400;
      return { error: 'Failed to create master option' };
    }
  })
  .put('/:id', async ({ params, body, set }) => {
    try {
      const result = await db
        .update(masterOptions)
        .set(body)
        .where(eq(masterOptions.id, Number(params.id)))
        .returning();
      return result[0];
    } catch (error) {
      set.status = 400;
      return { error: 'Failed to update master option' };
    }
  })
  .delete('/:id', async ({ params, set }) => {
    try {
      await db.delete(masterOptions).where(eq(masterOptions.id, Number(params.id)));
      return { success: true };
    } catch (error) {
      set.status = 400;
      return { error: 'Failed to delete master option' };
    }
  });
