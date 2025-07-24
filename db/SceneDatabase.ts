import {
  Scene,
  SceneTemplate,
  SceneSchedule,
  SceneAutomation,
} from "../shared/types/Scene.js";
import { db } from "./index.js";

export class SceneDatabase {
  /**
   * Get all scenes
   */
  async getAllScenes(): Promise<Scene[]> {
    // TODO: Refactor to use Drizzle query builder
    console.warn(
      "getAllScenes in SceneDatabase is not implemented with Drizzle yet.",
    );
    return [];
    // const scenes = await db.query(`
    //   SELECT
    //     s.*,
    //     GROUP_CONCAT(DISTINCT ss.user_id) as shared_with,
    //     GROUP_CONCAT(DISTINCT sds.device_id || ':' || sds.state) as device_states,
    //     sch.id as schedule_id,
    //     sch.type as schedule_type,
    //     sch.time as schedule_time,
    //     sch.days as schedule_days,
    //     sch.date as schedule_date,
    //     sch.enabled as schedule_enabled,
    //     sch.last_run as schedule_last_run,
    //     sch.next_run as schedule_next_run,
    //     aut.id as automation_id,
    //     aut.type as automation_type,
    //     aut.trigger as automation_trigger,
    //     aut.enabled as automation_enabled,
    //     aut.last_triggered as automation_last_triggered
    //   FROM scenes s
    //   LEFT JOIN scene_sharing ss ON s.id = ss.scene_id
    //   LEFT JOIN scene_device_states sds ON s.id = sds.scene_id
    //   LEFT JOIN scene_schedules sch ON s.id = sch.scene_id
    //   LEFT JOIN scene_automations aut ON s.id = aut.scene_id
    //   GROUP BY s.id
    // `);

    // return scenes.map(this.mapSceneFromDb);
  }

  /**
   * Get a scene by ID
   */
  async getScene(id: string): Promise<Scene | null> {
    // TODO: Refactor to use Drizzle query builder
    console.warn(
      `getScene(${id}) in SceneDatabase is not implemented with Drizzle yet.`,
    );
    return null;
    // const [scene] = await db.query(
    //   `SELECT * FROM scenes WHERE id = ?`,
    //   [id]
    // );

    // if (!scene) return null;

    // const deviceStates = await db.query(
    //   `SELECT device_id, state FROM scene_device_states WHERE scene_id = ?`,
    //   [id]
    // );

    // const schedule = await db.query(
    //   `SELECT * FROM scene_schedules WHERE scene_id = ?`,
    //   [id]
    // );

    // const automation = await db.query(
    //   `SELECT * FROM scene_automations WHERE scene_id = ?`,
    //   [id]
    // );

    // const sharedWith = await db.query(
    //   `SELECT user_id FROM scene_sharing WHERE scene_id = ?`,
    //   [id]
    // );

    // return this.mapSceneFromDb({
    //   ...scene,
    //   device_states: deviceStates.map(d => `${d.device_id}:${d.state}`).join(','),
    //   schedule_id: schedule[0]?.id,
    //   schedule_type: schedule[0]?.type,
    //   schedule_time: schedule[0]?.time,
    //   schedule_days: schedule[0]?.days,
    //   schedule_date: schedule[0]?.date,
    //   schedule_enabled: schedule[0]?.enabled,
    //   automation_id: automation[0]?.id,
    //   automation_type: automation[0]?.type,
    //   automation_trigger: automation[0]?.trigger,
    //   automation_enabled: automation[0]?.enabled,
    //   shared_with: sharedWith.map(s => s.user_id).join(',')
    // });
  }

  /**
   * Insert a new scene
   */
  async insertScene(scene: Scene): Promise<void> {
    // TODO: Refactor to use Drizzle query builder and transactions
    console.warn(
      `insertScene for scene ID ${scene.id} in SceneDatabase is not implemented with Drizzle yet.`,
    );
    return;
    // await db.exec('BEGIN TRANSACTION');

    // try {
    //   await db.insert('scenes', {
    //     id: scene.id,
    //     name: scene.name,
    //     description: scene.description,
    //     icon: scene.icon,
    //     color: scene.color,
    //     owner: scene.owner,
    //     is_template: scene.isTemplate ? 1 : 0,
    //     template_id: scene.templateId,
    //     shared: scene.shared ? 1 : 0,
    //     created_at: scene.createdAt,
    //     updated_at: scene.updatedAt,
    //     last_activated_at: scene.lastActivatedAt,
    //     tags: scene.tags?.join(',')
    //   });

    //   // Insert device states
    //   for (const state of scene.deviceStates) {
    //     await db.insert('scene_device_states', {
    //       scene_id: scene.id,
    //       device_id: state.deviceId,
    //       state: JSON.stringify(state.state)
    //     });
    //   }

    //   // Insert schedule if present
    //   if (scene.schedule) {
    //     await db.insert('scene_schedules', {
    //       id: scene.schedule.id,
    //       scene_id: scene.id,
    //       type: scene.schedule.type,
    //       time: scene.schedule.time,
    //       days: scene.schedule.days?.join(','),
    //       date: scene.schedule.date,
    //       enabled: scene.schedule.enabled ? 1 : 0,
    //       last_run: scene.schedule.lastRun,
    //       next_run: scene.schedule.nextRun
    //     });
    //   }

    //   // Insert automation if present
    //   if (scene.automation) {
    //     await db.insert('scene_automations', {
    //       id: scene.automation.id,
    //       scene_id: scene.id,
    //       type: scene.automation.type,
    //       trigger: JSON.stringify(scene.automation.trigger),
    //       enabled: scene.automation.enabled ? 1 : 0,
    //       last_triggered: scene.automation.lastTriggered
    //     });
    //   }

    //   // Insert sharing information
    //   if (scene.sharedWith?.length) {
    //     for (const userId of scene.sharedWith) {
    //       await db.insert('scene_sharing', {
    //         scene_id: scene.id,
    //         user_id: userId,
    //         shared_at: new Date().toISOString()
    //       });
    //     }
    //   }

    //   await db.exec('COMMIT');
    // } catch (error) {
    //   await db.exec('ROLLBACK');
    //   throw error;
    // }
  }

  /**
   * Update an existing scene
   */
  async updateScene(id: string, scene: Partial<Scene>): Promise<void> {
    // TODO: Refactor to use Drizzle query builder and transactions
    console.warn(
      `updateScene for scene ID ${id} in SceneDatabase is not implemented with Drizzle yet.`,
    );
    return;
    // await db.exec('BEGIN TRANSACTION');

    // try {
    //   if (Object.keys(scene).length > 0) {
    //     await db.update('scenes', id, {
    //       name: scene.name,
    //       description: scene.description,
    //       icon: scene.icon,
    //       color: scene.color,
    //       shared: scene.shared ? 1 : 0,
    //       updated_at: new Date().toISOString(),
    //       last_activated_at: scene.lastActivatedAt,
    //       tags: scene.tags?.join(',')
    //     });
    //   }

    //   // Update device states
    //   if (scene.deviceStates) {
    //     await db.exec('DELETE FROM scene_device_states WHERE scene_id = ?', [id]);
    //     for (const state of scene.deviceStates) {
    //       await db.insert('scene_device_states', {
    //         scene_id: id,
    //         device_id: state.deviceId,
    //         state: JSON.stringify(state.state)
    //       });
    //     }
    //   }

    //   // Update schedule
    //   if (scene.schedule) {
    //     await db.exec('DELETE FROM scene_schedules WHERE scene_id = ?', [id]);
    //     await db.insert('scene_schedules', {
    //       id: scene.schedule.id,
    //       scene_id: id,
    //       type: scene.schedule.type,
    //       time: scene.schedule.time,
    //       days: scene.schedule.days?.join(','),
    //       date: scene.schedule.date,
    //       enabled: scene.schedule.enabled ? 1 : 0,
    //       last_run: scene.schedule.lastRun,
    //       next_run: scene.schedule.nextRun
    //     });
    //   }

    //   // Update automation
    //   if (scene.automation) {
    //     await db.exec('DELETE FROM scene_automations WHERE scene_id = ?', [id]);
    //     await db.insert('scene_automations', {
    //       id: scene.automation.id,
    //       scene_id: id,
    //       type: scene.automation.type,
    //       trigger: JSON.stringify(scene.automation.trigger),
    //       enabled: scene.automation.enabled ? 1 : 0,
    //       last_triggered: scene.automation.lastTriggered
    //     });
    //   }

    //   // Update sharing
    //   if (scene.sharedWith) {
    //     await db.exec('DELETE FROM scene_sharing WHERE scene_id = ?', [id]);
    //     for (const userId of scene.sharedWith) {
    //       await db.insert('scene_sharing', {
    //         scene_id: id,
    //         user_id: userId,
    //         shared_at: new Date().toISOString()
    //       });
    //     }
    //   }

    //   await db.exec('COMMIT');
    // } catch (error) {
    //   await db.exec('ROLLBACK');
    //   throw error;
    // }
  }

  /**
   * Delete a scene
   */
  async deleteScene(id: string): Promise<void> {
    // TODO: Refactor to use Drizzle query builder
    console.warn(
      `deleteScene for scene ID ${id} in SceneDatabase is not implemented with Drizzle yet.`,
    );
    return;
    // await db.remove('scenes', id);
  }

  /**
   * Get all scene templates
   */
  async getAllSceneTemplates(): Promise<SceneTemplate[]> {
    // TODO: Refactor to use Drizzle query builder
    console.warn(
      "getAllSceneTemplates in SceneDatabase is not implemented with Drizzle yet.",
    );
    return [];
    // const templates = await db.query(`
    //   SELECT
    //     t.*,
    //     GROUP_CONCAT(DISTINCT sds.device_id || ':' || sds.state) as device_states
    //   FROM scene_templates t
    //   LEFT JOIN scene_device_states sds ON t.id = sds.scene_id
    //   GROUP BY t.id
    // `);

    // return templates.map(this.mapTemplateFromDb);
  }

  /**
   * Insert a new scene template
   */
  async insertSceneTemplate(template: SceneTemplate): Promise<void> {
    // TODO: Refactor to use Drizzle query builder and transactions
    console.warn(
      `insertSceneTemplate for template ID ${template.id} in SceneDatabase is not implemented with Drizzle yet.`,
    );
    return;
    // await db.exec('BEGIN TRANSACTION');

    // try {
    //   await db.insert('scene_templates', {
    //     id: template.id,
    //     name: template.name,
    //     description: template.description,
    //     icon: template.icon,
    //     color: template.color,
    //     category: template.category,
    //     popularity: template.popularity,
    //     preview_image: template.previewImage,
    //     created_at: new Date().toISOString(),
    //     updated_at: new Date().toISOString()
    //   });

    //   // Insert device states
    //   for (const state of template.deviceStates) {
    //     await db.insert('scene_device_states', {
    //       scene_id: template.id,
    //       device_id: state.deviceId,
    //       state: JSON.stringify(state.state)
    //     });
    //   }

    //   await db.exec('COMMIT');
    // } catch (error) {
    //   await db.exec('ROLLBACK');
    //   throw error;
    // }
  }

  private mapSceneFromDb(row: any): Scene {
    const deviceStates =
      row.device_states?.split(",").map((ds) => {
        const [deviceId, state] = ds.split(":");
        return {
          deviceId,
          state: JSON.parse(state),
        };
      }) || [];

    const schedule = row.schedule_id
      ? {
          id: row.schedule_id,
          type: row.schedule_type,
          time: row.schedule_time,
          days: row.schedule_days?.split(",").map(Number),
          date: row.schedule_date,
          enabled: Boolean(row.schedule_enabled),
          lastRun: row.schedule_last_run,
          nextRun: row.schedule_next_run,
        }
      : undefined;

    const automation = row.automation_id
      ? {
          id: row.automation_id,
          type: row.automation_type,
          trigger: JSON.parse(row.automation_trigger),
          enabled: Boolean(row.automation_enabled),
          lastTriggered: row.automation_last_triggered,
        }
      : undefined;

    return {
      id: row.id,
      name: row.name,
      description: row.description,
      icon: row.icon,
      color: row.color,
      deviceStates,
      schedule,
      automation,
      isTemplate: Boolean(row.is_template),
      templateId: row.template_id,
      shared: Boolean(row.shared),
      sharedWith: row.shared_with?.split(","),
      owner: row.owner,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      lastActivatedAt: row.last_activated_at,
      tags: row.tags?.split(","),
    };
  }

  private mapTemplateFromDb(row: any): SceneTemplate {
    const deviceStates =
      row.device_states?.split(",").map((ds) => {
        const [deviceId, state] = ds.split(":");
        return {
          deviceId,
          state: JSON.parse(state),
        };
      }) || [];

    return {
      id: row.id,
      name: row.name,
      description: row.description,
      icon: row.icon,
      color: row.color,
      deviceStates,
      category: row.category,
      popularity: row.popularity,
      previewImage: row.preview_image,
      // owner: row.owner, // SceneTemplate does not have an owner property
      // createdAt: row.created_at, // SceneTemplate does not have createdAt
      // updatedAt: row.updated_at // SceneTemplate does not have updatedAt
    };
  }
}
