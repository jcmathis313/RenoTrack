# JobTread to TurnTrack Integration Research

## Research Question
Can a 'job' in JobTread be connected to a 'Project' in TurnTrack (RenoTrack)?

## TurnTrack Project Structure

Based on the codebase analysis, TurnTrack Projects have the following structure:

### Project Model (from `prisma/schema.prisma`)
```prisma
model Project {
  id          String   @id @default(cuid())
  unitId      String
  tenantId    String
  name        String
  notes       String?
  status      String?  @default("Pending") // "Pending" | "In Progress" | "Complete"
  vacancyDate DateTime?
  moveInDate  DateTime?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  unit        Unit                 @relation(fields: [unitId], references: [id])
  tenant      Tenant               @relation(fields: [tenantId], references: [id])
  assessments Assessment[]
  selections  DesignProject[]
  inspections Inspection[]
  assignments ProjectAssignment[]
  residents   ProjectResident[]
  projectNotes ProjectNote[]
}
```

### Key Project Fields:
- **id**: Unique identifier (CUID)
- **name**: Project name
- **notes**: Optional notes
- **status**: "Pending" | "In Progress" | "Complete"
- **vacancyDate**: Optional date
- **moveInDate**: Optional date
- **unitId**: Links to a Unit (required)
- **tenantId**: Links to a Tenant (required)

### Related Entities:
- **ProjectResident**: Stores resident information (firstName, lastName, phone, email)
- **ProjectNote**: Stores project notes
- **ProjectAssignment**: Links users to projects
- **Assessments, Selections, Inspections**: Can be associated with projects

## JobTread API Capabilities

### API Structure:
- **Query Language**: Pave (similar to GraphQL)
- **Endpoint**: `http://api.jobtread.com/t/`
- **Authentication**: Grant keys
- **Webhooks**: Supported for real-time updates

### Known Operations:
- `account({ id }) nullable account` - Account information
- `can({ action, id }) boolean` - Permission checks
- `cancelWorkflowRun({ id }) root` - Workflow operations
- `closeNegativePayable({ id, description, paidAt, type }) root` - Payable management

### Webhook Events:
- File uploads
- Task updates
- Customer creation

## Integration Approaches

### Option 1: Direct API Integration (Recommended if JobTread has job objects)

**Requirements:**
1. JobTread API must expose job objects with queryable fields
2. Need to identify job fields that map to TurnTrack Project fields
3. Need to obtain a JobTread grant key
4. Need to implement Pave query client in TurnTrack

**Implementation Steps:**
1. **Add JobTread Integration Fields to Project Model:**
   ```prisma
   model Project {
     // ... existing fields ...
     jobTreadJobId String? @unique  // Store JobTread job ID
     jobTreadSyncEnabled Boolean @default(false)
     lastSyncedAt DateTime?
   }
   ```

2. **Create JobTread API Client:**
   - Implement Pave query language client
   - Handle authentication with grant keys
   - Create functions to:
     - Fetch jobs from JobTread
     - Create/update jobs in JobTread
     - Sync job status changes

3. **Create Sync API Endpoints:**
   - `POST /api/integrations/jobtread/sync` - Manual sync
   - `GET /api/integrations/jobtread/jobs` - List available jobs
   - `POST /api/integrations/jobtread/link` - Link existing job to project

4. **Field Mapping Considerations:**
   - JobTread job name → TurnTrack Project name
   - JobTread job status → TurnTrack Project status
   - JobTread customer → TurnTrack ProjectResident
   - JobTread dates → TurnTrack vacancyDate/moveInDate
   - JobTread notes → TurnTrack Project notes

**Challenges:**
- TurnTrack Projects require a `unitId` - need to map JobTread location/address to TurnTrack Unit
- TurnTrack is multi-tenant - need to handle tenant isolation
- Need to determine if JobTread jobs have unique identifiers
- Bidirectional sync complexity (which system is source of truth?)

### Option 2: Webhook-Based Integration

**How it works:**
1. Set up webhook in JobTread to POST to TurnTrack endpoint when jobs are created/updated
2. TurnTrack receives webhook and creates/updates corresponding Project

**Implementation:**
1. **Create Webhook Endpoint:**
   ```typescript
   // app/api/integrations/jobtread/webhook/route.ts
   POST /api/integrations/jobtread/webhook
   ```

2. **Webhook Handler:**
   - Verify webhook signature (if JobTread provides)
   - Parse job data from webhook payload
   - Map JobTread job to TurnTrack Project
   - Create or update Project
   - Handle errors and retries

**Advantages:**
- Real-time synchronization
- No polling required
- JobTread initiates updates

**Challenges:**
- Need to handle webhook security
- Need to map JobTread data structure to TurnTrack
- Still need to solve unitId mapping problem

### Option 3: Zapier Integration (If Available)

**How it works:**
1. Use Zapier to create automation between JobTread and TurnTrack
2. Trigger: New/updated job in JobTread
3. Action: Create/update project in TurnTrack

**Requirements:**
- Both platforms must support Zapier
- TurnTrack would need Zapier webhook endpoint or API
- May require custom Zapier app development

**Current Status:**
- JobTread: ✅ Supports Zapier
- TurnTrack: ❓ Unknown - would need to verify

### Option 4: Manual Import/Export

**How it works:**
1. Export jobs from JobTread (CSV/API)
2. Import into TurnTrack via UI or API
3. Manual linking of records

**Implementation:**
- Create import UI in TurnTrack
- Parse JobTread export format
- Map fields and create Projects
- Allow manual unit assignment

## Key Questions to Answer

### 1. JobTread Job Object Structure
- ❓ What fields does a JobTread job have?
- ❓ Does it have a unique ID?
- ❓ What is the job status field structure?
- ❓ Does it have customer/contact information?
- ❓ Does it have location/address information?

### 2. Mapping Challenges
- ❓ How to map JobTread location to TurnTrack Unit?
  - JobTread likely has address/location
  - TurnTrack requires specific Unit ID
  - May need manual mapping or address matching logic
- ❓ How to handle tenant isolation?
  - TurnTrack is multi-tenant
  - Need to determine which tenant owns the integration
- ❓ Which system is source of truth?
  - One-way sync (JobTread → TurnTrack)?
  - Two-way sync (bidirectional)?
  - Manual linking only?

### 3. Technical Requirements
- ❓ Does TurnTrack have API endpoints for external integrations?
- ❓ Can TurnTrack receive webhooks?
- ❓ What authentication does TurnTrack API require?
- ❓ Does TurnTrack support Zapier?

## Recommended Next Steps

### 1. Explore JobTread API Schema
- Use the interactive API explorer at https://app.jobtread.com/docs
- Search for "job" objects in the schema
- Identify available job fields and operations
- Test queries to retrieve job data

### 2. Determine Integration Scope
- Decide on sync direction (one-way vs bidirectional)
- Identify which fields to sync
- Determine sync frequency (real-time vs scheduled)

### 3. Address Mapping Challenges
- Create mapping table for JobTread locations → TurnTrack Units
- Or implement address matching logic
- Consider manual mapping UI for users

### 4. Implement Integration
- Add JobTread fields to Project model
- Create JobTread API client
- Implement sync logic
- Add UI for linking and syncing
- Set up webhooks (if using webhook approach)

### 5. Testing
- Test with sample JobTread jobs
- Verify data mapping accuracy
- Test error handling
- Test sync conflicts resolution

## Current Limitations

1. **Unknown JobTread Job Structure**: Need to explore API to find job objects and fields
2. **Unit Mapping**: TurnTrack requires Unit ID, but JobTread likely has addresses
3. **No Existing Integration Code**: TurnTrack doesn't appear to have external API integration infrastructure
4. **Authentication**: Need to determine how to securely store JobTread grant keys

## Conclusion

**Yes, it is possible to connect JobTread jobs to TurnTrack Projects**, but several questions need to be answered first:

1. ✅ TurnTrack Projects have the necessary structure to store external IDs
2. ✅ JobTread has an API with webhook support
3. ❓ Need to verify JobTread job object structure
4. ❓ Need to solve Unit mapping challenge
5. ❓ Need to determine integration approach (API, webhooks, or Zapier)

**Recommended Approach:**
1. First, explore the JobTread API schema to find job objects
2. Create a proof-of-concept that fetches a job and displays its structure
3. Design the mapping strategy for Unit assignment
4. Implement one-way sync (JobTread → TurnTrack) first
5. Add UI for manual linking and sync controls

---

*Research conducted: December 29, 2025*
*Next step: Explore JobTread API schema for job objects*

