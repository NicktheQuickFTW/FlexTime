-- Grant connection privileges to service users
GRANT CONNECT ON DATABASE "HELiiX" TO team_availability_service;
GRANT CONNECT ON DATABASE "HELiiX" TO venue_management_service;
GRANT CONNECT ON DATABASE "HELiiX" TO constraint_validation_service;
GRANT CONNECT ON DATABASE "HELiiX" TO schedule_generation_service;