import logging

from pydoover.cloud.processor import Application
from pydoover.cloud.processor.types import AggregateUpdateEvent

from .app_config import EnnovoCompostWidgetConfig
from .app_ui import EnnovoCompostWidgetUI

log = logging.getLogger(__name__)


class EnnovoCompostWidgetApp(Application):
    """
    Ennovo Compost Widget Application.

    On deployment, the deployment_config aggregate is updated, which
    triggers on_aggregate_update via our subscription. We then push
    ui_state so the widget appears in the UI interpreter.
    """

    config: EnnovoCompostWidgetConfig

    async def setup(self):
        """Called once before processing any event."""
        self.ui = EnnovoCompostWidgetUI()
        self.ui_manager.add_children(*self.ui.fetch())

    async def on_aggregate_update(self, event: AggregateUpdateEvent):
        """Triggered when deployment_config aggregate is updated (i.e. on deployment)."""
        log.info(f"Aggregate update received for agent {self.agent_id}")
        await self.ui_manager.push_async(even_if_empty=True)
        log.info("Pushed ui_state with widget entry")
