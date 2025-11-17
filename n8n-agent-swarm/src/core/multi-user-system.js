/**
 * Multi-User System v2.0
 *
 * Système multi-utilisateurs avec:
 * - Team management
 * - Roles & permissions (RBAC)
 * - Shared credentials
 * - Collaboration features
 * - Activity feed
 * - User invitations
 * - Team analytics
 */

const EventEmitter = require('events');
const crypto = require('crypto');
const logger = require('../utils/logger');

class MultiUserSystem extends EventEmitter {
  constructor() {
    super();

    // Users
    this.users = new Map(); // userId → user

    // Teams
    this.teams = new Map(); // teamId → team

    // Roles & Permissions
    this.roles = this.initializeRoles();

    // Invitations
    this.invitations = new Map(); // invitationId → invitation

    // Activity feed
    this.activities = [];
    this.maxActivities = 1000;

    // Shared resources
    this.sharedCredentials = new Map(); // credentialId → sharing info
    this.sharedWorkflows = new Map(); // workflowId → sharing info

    logger.info('👥 Multi-User System initialized');
  }

  /**
   * Initialize default roles
   */
  initializeRoles() {
    return {
      owner: {
        name: 'Owner',
        permissions: ['*'], // All permissions
        description: 'Full access to everything'
      },
      admin: {
        name: 'Admin',
        permissions: [
          'team.manage',
          'users.manage',
          'credentials.manage',
          'workflows.manage',
          'settings.manage'
        ],
        description: 'Full administrative access'
      },
      member: {
        name: 'Member',
        permissions: [
          'credentials.view',
          'credentials.use',
          'workflows.view',
          'workflows.create',
          'workflows.edit_own',
          'workflows.execute'
        ],
        description: 'Standard member access'
      },
      viewer: {
        name: 'Viewer',
        permissions: [
          'credentials.view',
          'workflows.view'
        ],
        description: 'Read-only access'
      }
    };
  }

  /**
   * User Management
   */
  createUser(userData) {
    const user = {
      id: this.generateId(),
      email: userData.email,
      name: userData.name,
      avatar: userData.avatar || null,
      role: userData.role || 'member',
      teams: [],
      settings: {
        notifications: true,
        emailDigest: 'daily',
        timezone: 'UTC'
      },
      metadata: {
        createdAt: new Date().toISOString(),
        lastActiveAt: null,
        loginCount: 0
      }
    };

    this.users.set(user.id, user);

    this.logActivity({
      type: 'user_created',
      userId: user.id,
      description: `User ${user.name} created`
    });

    logger.info(`✅ User created: ${user.name} (${user.id})`);

    return user;
  }

  getUser(userId) {
    return this.users.get(userId);
  }

  updateUser(userId, updates) {
    const user = this.users.get(userId);

    if (!user) {
      throw new Error(`User ${userId} not found`);
    }

    Object.assign(user, updates);

    this.logActivity({
      type: 'user_updated',
      userId,
      description: `User ${user.name} updated`
    });

    return user;
  }

  deleteUser(userId) {
    const user = this.users.get(userId);

    if (!user) {
      throw new Error(`User ${userId} not found`);
    }

    // Remove from teams
    user.teams.forEach(teamId => {
      this.removeUserFromTeam(teamId, userId);
    });

    this.users.delete(userId);

    this.logActivity({
      type: 'user_deleted',
      userId,
      description: `User ${user.name} deleted`
    });

    logger.info(`🗑️ User deleted: ${user.name}`);
  }

  /**
   * Team Management
   */
  createTeam(teamData, ownerId) {
    const team = {
      id: this.generateId(),
      name: teamData.name,
      description: teamData.description || '',
      owner: ownerId,
      members: [
        {
          userId: ownerId,
          role: 'owner',
          joinedAt: new Date().toISOString()
        }
      ],
      settings: {
        visibility: 'private',
        allowInvitations: true
      },
      metadata: {
        createdAt: new Date().toISOString(),
        memberCount: 1
      }
    };

    this.teams.set(team.id, team);

    // Add team to owner
    const owner = this.users.get(ownerId);
    if (owner) {
      owner.teams.push(team.id);
    }

    this.logActivity({
      type: 'team_created',
      userId: ownerId,
      teamId: team.id,
      description: `Team "${team.name}" created`
    });

    logger.info(`✅ Team created: ${team.name} (${team.id})`);

    return team;
  }

  getTeam(teamId) {
    return this.teams.get(teamId);
  }

  addUserToTeam(teamId, userId, role = 'member') {
    const team = this.teams.get(teamId);
    const user = this.users.get(userId);

    if (!team) throw new Error(`Team ${teamId} not found`);
    if (!user) throw new Error(`User ${userId} not found`);

    // Check if already member
    const existing = team.members.find(m => m.userId === userId);
    if (existing) {
      throw new Error('User already in team');
    }

    // Add to team
    team.members.push({
      userId,
      role,
      joinedAt: new Date().toISOString()
    });

    team.metadata.memberCount = team.members.length;

    // Add team to user
    user.teams.push(teamId);

    this.logActivity({
      type: 'user_added_to_team',
      userId,
      teamId,
      description: `${user.name} added to team "${team.name}"`
    });

    logger.info(`✅ User ${user.name} added to team ${team.name}`);

    return team;
  }

  removeUserFromTeam(teamId, userId) {
    const team = this.teams.get(teamId);
    const user = this.users.get(userId);

    if (!team) throw new Error(`Team ${teamId} not found`);
    if (!user) throw new Error(`User ${userId} not found`);

    // Remove from team
    team.members = team.members.filter(m => m.userId !== userId);
    team.metadata.memberCount = team.members.length;

    // Remove team from user
    user.teams = user.teams.filter(t => t !== teamId);

    this.logActivity({
      type: 'user_removed_from_team',
      userId,
      teamId,
      description: `${user.name} removed from team "${team.name}"`
    });

    logger.info(`🗑️ User ${user.name} removed from team ${team.name}`);
  }

  updateUserRole(teamId, userId, newRole) {
    const team = this.teams.get(teamId);

    if (!team) throw new Error(`Team ${teamId} not found`);

    const member = team.members.find(m => m.userId === userId);

    if (!member) {
      throw new Error('User not in team');
    }

    const oldRole = member.role;
    member.role = newRole;

    this.logActivity({
      type: 'role_changed',
      userId,
      teamId,
      description: `Role changed from ${oldRole} to ${newRole}`
    });

    logger.info(`✅ User role updated: ${userId} → ${newRole}`);

    return team;
  }

  /**
   * Permissions & Authorization
   */
  hasPermission(userId, permission, teamId = null) {
    const user = this.users.get(userId);

    if (!user) return false;

    // Get user's role
    let role;

    if (teamId) {
      const team = this.teams.get(teamId);
      if (!team) return false;

      const member = team.members.find(m => m.userId === userId);
      if (!member) return false;

      role = member.role;
    } else {
      role = user.role;
    }

    const rolePermissions = this.roles[role]?.permissions || [];

    // Owner has all permissions
    if (rolePermissions.includes('*')) return true;

    // Check specific permission
    return rolePermissions.includes(permission);
  }

  checkPermission(userId, permission, teamId = null) {
    if (!this.hasPermission(userId, permission, teamId)) {
      throw new Error(`Permission denied: ${permission}`);
    }
  }

  /**
   * Invitations
   */
  createInvitation(teamId, invitedBy, email, role = 'member') {
    this.checkPermission(invitedBy, 'users.manage', teamId);

    const invitation = {
      id: this.generateId(),
      teamId,
      email,
      role,
      invitedBy,
      status: 'pending',
      token: crypto.randomBytes(32).toString('hex'),
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
    };

    this.invitations.set(invitation.id, invitation);

    const team = this.teams.get(teamId);

    this.logActivity({
      type: 'invitation_sent',
      userId: invitedBy,
      teamId,
      description: `Invitation sent to ${email} for team "${team.name}"`
    });

    logger.info(`📧 Invitation sent: ${email} to team ${team.name}`);

    return invitation;
  }

  acceptInvitation(invitationId, userId) {
    const invitation = this.invitations.get(invitationId);

    if (!invitation) {
      throw new Error('Invitation not found');
    }

    if (invitation.status !== 'pending') {
      throw new Error('Invitation already processed');
    }

    if (new Date(invitation.expiresAt) < new Date()) {
      throw new Error('Invitation expired');
    }

    // Add user to team
    this.addUserToTeam(invitation.teamId, userId, invitation.role);

    invitation.status = 'accepted';
    invitation.acceptedAt = new Date().toISOString();
    invitation.acceptedBy = userId;

    this.logActivity({
      type: 'invitation_accepted',
      userId,
      teamId: invitation.teamId,
      description: 'Invitation accepted'
    });

    logger.info(`✅ Invitation accepted by user ${userId}`);

    return invitation;
  }

  /**
   * Shared Resources
   */
  shareCredential(credentialId, teamId, sharedBy, permissions = ['use']) {
    this.checkPermission(sharedBy, 'credentials.manage', teamId);

    const sharing = {
      credentialId,
      teamId,
      sharedBy,
      permissions, // ['view', 'use', 'edit']
      sharedAt: new Date().toISOString()
    };

    this.sharedCredentials.set(credentialId, sharing);

    this.logActivity({
      type: 'credential_shared',
      userId: sharedBy,
      teamId,
      description: `Credential shared with team`
    });

    logger.info(`✅ Credential ${credentialId} shared with team ${teamId}`);

    return sharing;
  }

  unshareCredential(credentialId, userId) {
    const sharing = this.sharedCredentials.get(credentialId);

    if (!sharing) {
      throw new Error('Credential not shared');
    }

    this.checkPermission(userId, 'credentials.manage', sharing.teamId);

    this.sharedCredentials.delete(credentialId);

    this.logActivity({
      type: 'credential_unshared',
      userId,
      teamId: sharing.teamId,
      description: 'Credential unshared'
    });

    logger.info(`🗑️ Credential ${credentialId} unshared`);
  }

  shareWorkflow(workflowId, teamId, sharedBy, permissions = ['view', 'execute']) {
    this.checkPermission(sharedBy, 'workflows.manage', teamId);

    const sharing = {
      workflowId,
      teamId,
      sharedBy,
      permissions, // ['view', 'execute', 'edit']
      sharedAt: new Date().toISOString()
    };

    this.sharedWorkflows.set(workflowId, sharing);

    this.logActivity({
      type: 'workflow_shared',
      userId: sharedBy,
      teamId,
      description: 'Workflow shared with team'
    });

    logger.info(`✅ Workflow ${workflowId} shared with team ${teamId}`);

    return sharing;
  }

  /**
   * Activity Feed
   */
  logActivity(activity) {
    const entry = {
      id: this.generateId(),
      ...activity,
      timestamp: activity.timestamp || new Date().toISOString()
    };

    this.activities.unshift(entry);

    if (this.activities.length > this.maxActivities) {
      this.activities = this.activities.slice(0, this.maxActivities);
    }

    this.emit('activity', entry);
  }

  getActivityFeed(filters = {}, limit = 50) {
    let activities = this.activities;

    if (filters.userId) {
      activities = activities.filter(a => a.userId === filters.userId);
    }

    if (filters.teamId) {
      activities = activities.filter(a => a.teamId === filters.teamId);
    }

    if (filters.type) {
      activities = activities.filter(a => a.type === filters.type);
    }

    return activities.slice(0, limit);
  }

  /**
   * Team Analytics
   */
  getTeamAnalytics(teamId) {
    const team = this.teams.get(teamId);

    if (!team) {
      throw new Error(`Team ${teamId} not found`);
    }

    const analytics = {
      memberCount: team.members.length,
      roleDistribution: {},
      activityStats: {
        totalActions: 0,
        recentActivity: []
      },
      sharedResources: {
        credentials: 0,
        workflows: 0
      }
    };

    // Role distribution
    team.members.forEach(member => {
      analytics.roleDistribution[member.role] =
        (analytics.roleDistribution[member.role] || 0) + 1;
    });

    // Shared resources
    this.sharedCredentials.forEach(sharing => {
      if (sharing.teamId === teamId) {
        analytics.sharedResources.credentials++;
      }
    });

    this.sharedWorkflows.forEach(sharing => {
      if (sharing.teamId === teamId) {
        analytics.sharedResources.workflows++;
      }
    });

    // Recent activity
    analytics.activityStats.recentActivity = this.getActivityFeed(
      { teamId },
      10
    );

    analytics.activityStats.totalActions = analytics.activityStats.recentActivity.length;

    return analytics;
  }

  /**
   * Utilities
   */
  generateId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Statistics
   */
  getStats() {
    return {
      totalUsers: this.users.size,
      totalTeams: this.teams.size,
      totalInvitations: this.invitations.size,
      pendingInvitations: Array.from(this.invitations.values())
        .filter(i => i.status === 'pending').length,
      sharedCredentials: this.sharedCredentials.size,
      sharedWorkflows: this.sharedWorkflows.size,
      recentActivities: this.activities.length
    };
  }
}

module.exports = MultiUserSystem;
