import { permissionRepository } from '@/users/permissions/permissions.repository';
import { roleRepository } from '@/users/roles/roles.repository';
import type { Role } from '@/users/roles/roles.types';
import { roleFactory } from '@/factories';
import {
  CLIENT_DATA_FILES,
  hasClientData,
  loadClientData,
} from './client-data.utils';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type FactoryDb = any;

interface RoleData {
  name: string;
  description: string;
  permissions?: string[];
}

interface ClientRolesData {
  metadata: {
    generated_at: string;
    total_roles: number;
    description: string;
  };
  roles: RoleData[];
}

/**
 * Predefined roles for seeding
 */
const PREDEFINED_ROLES = [
  {
    name: 'Administrator',
    description: 'Full system access with all permissions',
    permissions: [
      'users_createuser',
      'users_updateuser',
      'users_deleteuser',
      'users_getuser',
      'users_listusers',
      'users_listuserspaginated',
      'users_changepassword',
      'users_createrole',
      'users_getrole',
      'users_listroles',
      'users_listrolespaginated',
      'users_updaterole',
      'users_assignpermissionstorole',
      'users_deleterole',
      'users_createpermission',
      'users_getpermission',
      'users_listpermissions',
      'users_listpermissionswithpagination',
      'users_updatepermission',
      'users_deletepermission',
      'users_searchpermissions',
      'users_searchpermissionspaginated',
      'users_getuserwithroles',
      'users_getuserwithpermissions',
      'users_assignrolestouser',
      'users_assignpermissionstouser',
      'users_checkuserpermission',
      'users_checkuserrole',
      'users_getuserpermissions',
      'users_getuserroles',
      'users_createdepartment',
      'users_getdepartment',
      'users_listdepartments',
      'users_listdepartmentspaginated',
      'users_updatedepartment',
      'users_deletedepartment',
      'users_searchdepartments',
      'users_searchdepartmentspaginated',
      'users_createpermissiongroup',
      'users_listpermissiongroups',
      'users_updatepermissiongroup',
      'users_deletepermissiongroup',
      'users_listauditspaginated',
      'users_revokealltokens',
      'inventory_createamenity',
      'inventory_getamenity',
      'inventory_listamenities',
      'inventory_listamenitiespaginated',
      'inventory_updateamenity',
      'inventory_deleteamenity',
      'inventory_createpathway',
      'inventory_getpathway',
      'inventory_listpathways',
      'inventory_listpathwayspaginated',
      'inventory_updatepathway',
      'inventory_deletepathway',
      'inventory_addoptiontopathway',
      'inventory_removeoptionfrompathway',
      'inventory_updatepathwayoption',
      'inventory_setdefaultpathwayoption',
      'inventory_syncpathwayoptiontolls',
      'inventory_listpathwayoptiontolls',
      'inventory_createtransporter',
      'inventory_gettransporter',
      'inventory_listtransporters',
      'inventory_listtransporterspaginated',
      'inventory_updatetransporter',
      'inventory_deletetransporter',
      'inventory_createservicetype',
      'inventory_getservicetype',
      'inventory_listservicetypes',
      'inventory_listservicetypespaginated',
      'inventory_updateservicetype',
      'inventory_deleteservicetype',
      'inventory_assignamenitiestoservicetype',
      'inventory_createbusline',
      'inventory_getbusline',
      'inventory_listbuslines',
      'inventory_listbuslinespaginated',
      'inventory_updatebusline',
      'inventory_deletebusline',
      'inventory_gettimezone',
      'inventory_listtimezones',
      'inventory_createstate',
      'inventory_getstate',
      'inventory_liststates',
      'inventory_liststatespaginated',
      'inventory_updatestate',
      'inventory_deletestate',
      'inventory_createpopulation',
      'inventory_getpopulation',
      'inventory_listpopulations',
      'inventory_listpopulationspaginated',
      'inventory_updatepopulation',
      'inventory_assigncitiestopopulation',
      'inventory_assigncitytopopulation',
      'inventory_unassigncityfrompopulation',
      'inventory_listavailablecities',
      'inventory_getpopulationcities',
      'inventory_deletepopulation',
      'inventory_findpopulationbyassignedcity',
      'inventory_createnode',
      'inventory_getnode',
      'inventory_listnodes',
      'inventory_listnodespaginated',
      'inventory_updatenode',
      'inventory_deletenode',
      'inventory_assigneventstonode',
      'inventory_assignlabelstonode',
      'inventory_createlabel',
      'inventory_updatelabel',
      'inventory_deletelabel',
      'inventory_getlabel',
      'inventory_listlabelspaginated',
      'inventory_listlabels',
      'inventory_getlabelsmetrics',
      'inventory_createinstallation',
      'inventory_getinstallation',
      'inventory_updateinstallation',
      'inventory_listinstallations',
      'inventory_listinstallationspaginated',
      'inventory_deleteinstallation',
      'inventory_updateinstallationproperties',
      'inventory_assignamenitiestoinstallation',
      'inventory_createinstallationtype',
      'inventory_getinstallationtype',
      'inventory_getinstallationtypeschema',
      'inventory_syncinstallationschemas',
      'inventory_updateinstallationtype',
      'inventory_listinstallationtypes',
      'inventory_listinstallationtypespaginated',
      'inventory_deleteinstallationtype',
      'inventory_assigneventtypestoinstallationtype',
      'inventory_createinstallationschema',
      'inventory_getinstallationschema',
      'inventory_updateinstallationschema',
      'inventory_listinstallationschemas',
      'inventory_listinstallationschemaspaginated',
      'inventory_deleteinstallationschema',
      'inventory_createeventtype',
      'inventory_geteventtype',
      'inventory_updateeventtype',
      'inventory_listeventtypes',
      'inventory_listeventtypespaginated',
      'inventory_deleteeventtype',
      'inventory_createcountry',
      'inventory_getcountry',
      'inventory_listcountries',
      'inventory_listcountriespaginated',
      'inventory_updatecountry',
      'inventory_deletecountry',
      'inventory_createcity',
      'inventory_getcity',
      'inventory_listcities',
      'inventory_listcitiespaginated',
      'inventory_updatecity',
      'inventory_deletecity',
      'inventory_createtechnology',
      'inventory_gettechnology',
      'inventory_listtechnologies',
      'inventory_listtechnologiespaginated',
      'inventory_updatetechnology',
      'inventory_deletetechnology',
      'inventory_getseatdiagram',
      'inventory_updateseatdiagram',
      'inventory_deleteseatdiagram',
      'inventory_listseatdiagramseats',
      'inventory_updateseatdiagramconfiguration',
      'inventory_createseatdiagramzone',
      'inventory_getseatdiagramzone',
      'inventory_listzonesbydiagram',
      'inventory_listzonesbydiagrampaginated',
      'inventory_updateseatdiagramzone',
      'inventory_deleteseatdiagramzone',
      'inventory_createdriver',
      'inventory_getdriver',
      'inventory_listdrivers',
      'inventory_listdriverspaginated',
      'inventory_updatedriver',
      'inventory_deletedriver',
      'inventory_listdriversavailability',
      'inventory_createchromatic',
      'inventory_getchromatic',
      'inventory_listchromatics',
      'inventory_listchromaticspaginated',
      'inventory_updatechromatic',
      'inventory_deletechromatic',
      'inventory_createbus',
      'inventory_getbus',
      'inventory_listbuses',
      'inventory_listbusespaginated',
      'inventory_updatebus',
      'inventory_deletebus',
      'inventory_listbusvalidnextstatuses',
      'inventory_assigntechnologiestobus',
      'inventory_assigndriverstobuscrew',
      'inventory_createbusmodel',
      'inventory_getbusmodel',
      'inventory_listbusmodels',
      'inventory_listbusmodelspaginated',
      'inventory_updatebusmodel',
      'inventory_deletebusmodel',
      'inventory_assignamenitiestobusmodel',
      'inventory_createbusdiagrammodel',
      'inventory_getbusdiagrammodel',
      'inventory_listbusdiagrammodels',
      'inventory_listbusdiagrammodelspaginated',
      'inventory_updatebusdiagrammodel',
      'inventory_deletebusdiagrammodel',
      'inventory_updateseatconfiguration',
      'inventory_listbusdiagrammodelseats',
      'inventory_regenerateseats',
      'inventory_createbusdiagrammodelzone',
      'inventory_getbusdiagrammodelzone',
      'inventory_listzonesbydiagrammodel',
      'inventory_listzonesbydiagrammodelpaginated',
      'inventory_updatebusdiagrammodelzone',
      'inventory_deletebusdiagrammodelzone',
      'inventory_createdrivertimeoff',
      'inventory_getdrivertimeoff',
      'inventory_listdrivertimeoffs',
      'inventory_listdrivertimeoffspaginated',
      'inventory_updatedrivertimeoff',
      'inventory_deletedrivertimeoff',
      'inventory_createdrivermedicalcheck',
      'inventory_getdrivermedicalcheck',
      'inventory_listdrivermedicalchecks',
      'inventory_listdrivermedicalcheckspaginated',
    ],
  },
  {
    name: 'Read Only',
    description: 'Read-only access to the system',
    permissions: [
      'users_getuser',
      'users_listusers',
      'users_listuserspaginated',
      'users_getrole',
      'users_listroles',
      'users_listrolespaginated',
      'users_getpermission',
      'users_listpermissions',
      'users_listpermissionswithpagination',
      'users_getuserwithroles',
      'users_getuserwithpermissions',
      'users_checkuserpermission',
      'users_checkuserrole',
      'users_getuserpermissions',
      'users_getuserroles',
      'users_listauditspaginated',
      'inventory_getamenity',
      'inventory_listamenities',
      'inventory_listamenitiespaginated',
      'inventory_getpathway',
      'inventory_listpathways',
      'inventory_listpathwayspaginated',
      'inventory_listpathwayoptiontolls',
      'inventory_gettransporter',
      'inventory_listtransporters',
      'inventory_listtransporterspaginated',
      'inventory_getservicetype',
      'inventory_listservicetypes',
      'inventory_listservicetypespaginated',
      'inventory_getbusline',
      'inventory_listbuslines',
      'inventory_listbuslinespaginated',
      'inventory_gettimezone',
      'inventory_listtimezones',
      'inventory_getstate',
      'inventory_liststates',
      'inventory_liststatespaginated',
      'inventory_getpopulation',
      'inventory_listpopulations',
      'inventory_listpopulationspaginated',
      'inventory_listavailablecities',
      'inventory_getpopulationcities',
      'inventory_findpopulationbyassignedcity',
      'inventory_getnode',
      'inventory_listnodes',
      'inventory_listnodespaginated',
      'inventory_getlabel',
      'inventory_listlabels',
      'inventory_listlabelspaginated',
      'inventory_getlabelsmetrics',
      'inventory_getinstallation',
      'inventory_listinstallations',
      'inventory_listinstallationspaginated',
      'inventory_getinstallationtype',
      'inventory_getinstallationtypeschema',
      'inventory_listinstallationtypes',
      'inventory_listinstallationtypespaginated',
      'inventory_getinstallationschema',
      'inventory_listinstallationschemas',
      'inventory_listinstallationschemaspaginated',
      'inventory_geteventtype',
      'inventory_listeventtypes',
      'inventory_listeventtypespaginated',
      'inventory_getcountry',
      'inventory_listcountries',
      'inventory_listcountriespaginated',
      'inventory_getcity',
      'inventory_listcities',
      'inventory_listcitiespaginated',
      'inventory_gettechnology',
      'inventory_listtechnologies',
      'inventory_listtechnologiespaginated',
      'inventory_getseatdiagram',
      'inventory_listseatdiagramseats',
      'inventory_getseatdiagramzone',
      'inventory_listzonesbydiagram',
      'inventory_listzonesbydiagrampaginated',
      'inventory_getdriver',
      'inventory_listdrivers',
      'inventory_listdriverspaginated',
      'inventory_listdriversavailability',
      'inventory_getchromatic',
      'inventory_listchromatics',
      'inventory_listchromaticspaginated',
      'inventory_getbus',
      'inventory_listbuses',
      'inventory_listbusespaginated',
      'inventory_listbusvalidnextstatuses',
      'inventory_getbusmodel',
      'inventory_listbusmodels',
      'inventory_listbusmodelspaginated',
      'inventory_getbusdiagrammodel',
      'inventory_listbusdiagrammodels',
      'inventory_listbusdiagrammodelspaginated',
      'inventory_getbusdiagrammodelzone',
      'inventory_listzonesbydiagrammodel',
      'inventory_listzonesbydiagrammodelpaginated',
      'inventory_listbusdiagrammodelseats',
      'inventory_getdrivertimeoff',
      'inventory_listdrivertimeoffs',
      'inventory_listdrivertimeoffspaginated',
      'inventory_getdrivermedicalcheck',
      'inventory_listdrivermedicalchecks',
      'inventory_listdrivermedicalcheckspaginated',
    ],
  },
  {
    name: 'Editor',
    description: 'Editor access to the system',
    permissions: [
      'users_updateuser',
      'users_updaterole',
      'users_assignpermissionstorole',
      'users_updatepermission',
      'users_assignrolestouser',
      'users_assignpermissionstouser',
      'users_changepassword',
      'users_revokealltokens',
      'inventory_updateamenity',
      'inventory_updatepathway',
      'inventory_addoptiontopathway',
      'inventory_removeoptionfrompathway',
      'inventory_updatepathwayoption',
      'inventory_setdefaultpathwayoption',
      'inventory_syncpathwayoptiontolls',
      'inventory_updatetransporter',
      'inventory_updateservicetype',
      'inventory_assignamenitiestoservicetype',
      'inventory_updatebusline',
      'inventory_updatestate',
      'inventory_updatepopulation',
      'inventory_assigncitiestopopulation',
      'inventory_assigncitytopopulation',
      'inventory_unassigncityfrompopulation',
      'inventory_updatenode',
      'inventory_assigneventstonode',
      'inventory_assignlabelstonode',
      'inventory_updatelabel',
      'inventory_updateinstallation',
      'inventory_updateinstallationproperties',
      'inventory_assignamenitiestoinstallation',
      'inventory_updateinstallationtype',
      'inventory_assigneventtypestoinstallationtype',
      'inventory_syncinstallationschemas',
      'inventory_updateinstallationschema',
      'inventory_updateeventtype',
      'inventory_updatecountry',
      'inventory_updatecity',
      'inventory_updatetechnology',
      'inventory_updateseatdiagram',
      'inventory_updateseatdiagramconfiguration',
      'inventory_updateseatdiagramzone',
      'inventory_updatedriver',
      'inventory_updatechromatic',
      'inventory_updatebus',
      'inventory_assigntechnologiestobus',
      'inventory_assigndriverstobuscrew',
      'inventory_updatebusmodel',
      'inventory_assignamenitiestobusmodel',
      'inventory_updatebusdiagrammodel',
      'inventory_updatebusdiagrammodelzone',
      'inventory_updateseatconfiguration',
      'inventory_regenerateseats',
      'inventory_updatedrivertimeoff',
    ],
  },
];

/**
 * Creates roles from client data and assigns permissions
 * @param rolesData - Array of role data from client JSON
 * @param factoryDb - Factory database instance
 * @returns Array of created roles
 */
async function createRolesFromClientData(
  rolesData: RoleData[],
  factoryDb: FactoryDb,
): Promise<Role[]> {
  const roles: Role[] = [];

  for (const roleData of rolesData) {
    try {
      // Create the role using the factory
      const role = await roleFactory(factoryDb).create({
        name: roleData.name,
        description: roleData.description,
        deletedAt: null,
      });

      // If permissions are specified, assign them to the role
      if (roleData.permissions && roleData.permissions.length > 0) {
        try {
          // Get permission IDs by their codes
          const permissionIds: number[] = [];

          for (const permissionCode of roleData.permissions) {
            try {
              const permission =
                await permissionRepository.findByCode(permissionCode);
              permissionIds.push(permission.id);
            } catch (error) {
              console.error(
                `    ❌ Permission '${permissionCode}' ${error instanceof Error ? error.message : error}`,
              );
              throw new Error('Permission not found');
            }
          }

          // Assign permissions to the role if any were found
          if (permissionIds.length > 0) {
            await roleRepository.assignPermissions(role.id, { permissionIds });
          }
        } catch (error) {
          console.error(
            `    ❌ Failed to assign permissions to role ${roleData.name}:`,
            error,
          );
          throw new Error('Failed to assign permissions to role');
        }
      }

      roles.push(role as unknown as Role);
    } catch (error) {
      console.error(`    ❌ Failed to create role ${roleData.name}:`, error);
      throw new Error('Failed to create role');
    }
  }

  return roles;
}

/**
 * Seeds predefined roles
 * @param factoryDb - Factory database instance
 * @param clientCode - Optional client code for client-specific data
 * @returns Array of created roles
 */
export async function seedRoles(
  factoryDb: FactoryDb,
  clientCode?: string,
): Promise<Role[]> {
  // Try to use client data if available
  if (clientCode && hasClientData(clientCode, CLIENT_DATA_FILES.ROLES)) {
    try {
      const rolesData = (await loadClientData(
        clientCode,
        CLIENT_DATA_FILES.ROLES,
      )) as ClientRolesData;

      if (rolesData.roles?.length > 0) {
        const roles = await createRolesFromClientData(
          rolesData.roles,
          factoryDb,
        );
        return roles;
      }
    } catch (error) {
      console.error(
        `   ❌ Error loading client roles data: ${error instanceof Error ? error.message : error}`,
      );
      throw error;
    }
  }

  // Default behavior - use predefined roles
  const roles = await createRolesFromClientData(PREDEFINED_ROLES, factoryDb);
  return roles;
}
