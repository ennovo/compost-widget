"""
Basic tests for an application.

This ensures all modules are importable and that the config is valid.
"""

def test_import_app():
    from ennovo_compost_widget.application import EnnovoCompostWidgetApplication
    assert EnnovoCompostWidgetApplication

def test_config():
    from ennovo_compost_widget.app_config import EnnovoCompostWidgetConfig

    config = EnnovoCompostWidgetConfig()
    assert isinstance(config.to_dict(), dict)

def test_ui():
    from ennovo_compost_widget.app_ui import EnnovoCompostWidgetUI
    assert EnnovoCompostWidgetUI

def test_state():
    from ennovo_compost_widget.app_state import EnnovoCompostWidgetState
    assert EnnovoCompostWidgetState