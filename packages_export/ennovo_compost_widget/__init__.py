from pydoover.cloud.processor import run_app

from .application import EnnovoCompostWidgetApp
from .app_config import EnnovoCompostWidgetConfig


def handler(event, context):
    """Lambda handler entry point."""
    EnnovoCompostWidgetConfig.clear_elements()
    return run_app(
        EnnovoCompostWidgetApp(config=EnnovoCompostWidgetConfig()),
        event,
        context,
    )
