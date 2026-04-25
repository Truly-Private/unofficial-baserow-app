# Table Columns (Fields) Management - Implementation Plan

## User Request
Add ability to:
1. **Add columns** - Create new fields in a table
2. **Edit columns** - Modify field properties (name, type, options)
3. **Update columns** - Change existing field configuration

## Baserow REST API Endpoints

### List Fields
```
GET /api/database/fields/table/{table_id}/
```

### Create Field
```
POST /api/database/fields/table/{table_id}/
Body: { "name": "Field Name", "type": "text" }
```

### Get Field
```
GET /api/database/fields/{field_id}/
```

### Update Field
```
PATCH /api/database/fields/{field_id}/
Body: { "name": "New Name", "type": "text", "order": 1 }
```

### Delete Field
```
DELETE /api/database/fields/{field_id}/
```

### Duplicate Field (async)
```
POST /api/database/fields/{field_id}/duplicate/async/
```

## UI Implementation

### Screen 1: Field List (in Table Screen)
- Show fields panel/sheet
- List existing fields with type icons
- Add field button
- Tap to edit field

### Screen 2: Add/Edit Field Modal
- Field name input
- Field type selector (dropdown)
- Type-specific options:
  - Text: max length
  - Number: decimal places
  - Select: options
  - Date: include time
  - etc.

### Implementation Order
1. Extend API client with field CRUD methods
2. Add fields panel to table screen
3. Add field modal/sheet
4. Add field type configuration
5. Implement delete with confirmation
