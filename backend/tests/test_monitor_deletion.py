import unittest
from unittest.mock import Mock, patch

from app.models.monitor import MonitorCreate
from app.services import incident_service
from app.services.monitor_service import MonitorService


class MonitorDeletionTests(unittest.TestCase):
    def setUp(self):
        self.original_incident_repository = incident_service._repository
        incident_service._repository = None
        incident_service.incidents.clear()

        self.service = object.__new__(MonitorService)
        self.service._monitors = {}
        self.service._repository = None

    def tearDown(self):
        incident_service.incidents.clear()
        incident_service._repository = self.original_incident_repository

    def test_memory_delete_resolves_active_incident(self):
        user_id = "user-1"
        monitor = self.service.create_monitor(
            user_id,
            MonitorCreate(name="Example", url="https://example.com")
        )
        incident_service.open_incident(
            monitor=monitor,
            error="Connection failed",
            status_code=None,
        )

        self.assertTrue(self.service.delete_monitor(user_id, monitor.id))
        self.assertIsNone(
            incident_service.get_active_incident_for_monitor(user_id, monitor.id)
        )
        self.assertEqual(
            incident_service.list_incidents(user_id)[0].status,
            incident_service.IncidentStatus.RESOLVED,
        )

    def test_repository_delete_resolves_incident_after_success(self):
        repository = Mock()
        repository.delete_monitor.return_value = True
        self.service._repository = repository

        with patch("app.services.monitor_service.resolve_incident") as resolve:
            self.assertTrue(self.service.delete_monitor("user-1", "monitor-1"))

        repository.delete_monitor.assert_called_once_with("user-1", "monitor-1")
        resolve.assert_called_once_with("user-1", "monitor-1")


if __name__ == "__main__":
    unittest.main()
