/**
 * SCORM Manifest Parser
 * Parses SCORM 1.2 and 2004 imsmanifest.xml files
 */

export interface SCORMManifest {
    version: '1.2' | '2004';
    identifier: string;
    title: string;
    description?: string;
    launchUrl: string;
    masteryScore?: number;
    maxTimeAllowed?: string;
    timeLimitAction?: string;
    organizations?: Array<{
        identifier: string;
        title: string;
        items: Array<{
            identifier: string;
            title: string;
            launch?: string;
        }>;
    }>;
    resources?: Array<{
        identifier: string;
        type: string;
        href: string;
    }>;
}

/**
 * Parse SCORM manifest XML
 */
export async function parseSCORMManifest(xmlContent: string): Promise<SCORMManifest> {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlContent, 'text/xml');

    // Detect SCORM version
    const metadata = xmlDoc.getElementsByTagName('metadata')[0];
    const schemaversion = metadata?.getElementsByTagName('schemaversion')[0]?.textContent;
    const version = schemaversion?.includes('2004') ? '2004' : '1.2';

    // Get manifest identifier
    const manifestElement = xmlDoc.getElementsByTagName('manifest')[0];
    const identifier = manifestElement?.getAttribute('identifier') || '';

    // Get title from organizations
    const organizations = xmlDoc.getElementsByTagName('organizations')[0];
    const organization = organizations?.getElementsByTagName('organization')[0];
    const titleElement = organization?.getElementsByTagName('title')[0];
    const title = titleElement?.textContent || 'Untitled SCORM Package';

    // Get description
    const descElement = organization?.getElementsByTagName('adlcp:description')[0];
    const description = descElement?.textContent;

    // Get default organization
    const defaultOrg = organizations?.getAttribute('default');

    // Get resources
    const resourcesElement = xmlDoc.getElementsByTagName('resources')[0];
    const resourceElements = resourcesElement?.getElementsByTagName('resource') || [];

    // Find the launch URL from the first resource
    let launchUrl = '';
    if (resourceElements.length > 0) {
        const firstResource = resourceElements[0];
        launchUrl = firstResource.getAttribute('href') || '';
    }

    // Parse mastery score (SCORM 1.2)
    let masteryScore: number | undefined;
    const masteryScoreElement = xmlDoc.getElementsByTagName('adlcp:masteryscore')[0];
    if (masteryScoreElement) {
        masteryScore = parseFloat(masteryScoreElement.textContent || '0');
    }

    // Parse organizations structure
    const orgStructure: SCORMManifest['organizations'] = [];
    const orgElements = organizations?.getElementsByTagName('organization') || [];

    for (let i = 0; i < orgElements.length; i++) {
        const org = orgElements[i];
        const orgId = org.getAttribute('identifier') || '';
        const orgTitle = org.getElementsByTagName('title')[0]?.textContent || '';

        const items: any[] = [];
        const itemElements = org.getElementsByTagName('item');

        for (let j = 0; j < itemElements.length; j++) {
            const item = itemElements[j];
            const itemId = item.getAttribute('identifier') || '';
            const itemTitle = item.getElementsByTagName('title')[0]?.textContent || '';
            const itemRef = item.getAttribute('identifierref');

            // Find resource for this item
            let itemLaunch = '';
            if (itemRef) {
                for (let k = 0; k < resourceElements.length; k++) {
                    const res = resourceElements[k];
                    if (res.getAttribute('identifier') === itemRef) {
                        itemLaunch = res.getAttribute('href') || '';
                        break;
                    }
                }
            }

            items.push({
                identifier: itemId,
                title: itemTitle,
                launch: itemLaunch,
            });
        }

        orgStructure.push({
            identifier: orgId,
            title: orgTitle,
            items,
        });
    }

    // Parse resources
    const resourcesStructure: SCORMManifest['resources'] = [];
    for (let i = 0; i < resourceElements.length; i++) {
        const res = resourceElements[i];
        resourcesStructure.push({
            identifier: res.getAttribute('identifier') || '',
            type: res.getAttribute('type') || '',
            href: res.getAttribute('href') || '',
        });
    }

    return {
        version,
        identifier,
        title,
        description,
        launchUrl,
        masteryScore,
        organizations: orgStructure,
        resources: resourcesStructure,
    };
}

/**
 * Extract SCORM package (unzip and parse)
 * This would typically be done on the server/backend
 */
export async function extractSCORMPackage(zipFile: File): Promise<SCORMManifest> {
    // In a real implementation, you would:
    // 1. Send the zip file to your backend
    // 2. Backend unzips the file
    // 3. Backend reads imsmanifest.xml
    // 4. Backend parses the manifest
    // 5. Backend stores files and returns parsed data

    throw new Error('SCORM extraction must be implemented on the server side');
}

/**
 * Validate SCORM package structure
 */
export function validateSCORMPackage(manifest: SCORMManifest): {
    valid: boolean;
    errors: string[];
} {
    const errors: string[] = [];

    if (!manifest.identifier) {
        errors.push('Missing manifest identifier');
    }

    if (!manifest.title) {
        errors.push('Missing package title');
    }

    if (!manifest.launchUrl) {
        errors.push('Missing launch URL');
    }

    if (!manifest.version) {
        errors.push('Unknown SCORM version');
    }

    return {
        valid: errors.length === 0,
        errors,
    };
}
