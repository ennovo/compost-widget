from pydoover.ui import RemoteComponent

WIDGET_NAME = "EnnovoCompostWidget"
FILE_CHANNEL = "ennovo_compost_widget"


class EnnovoCompostWidgetUI:
    def __init__(self, position=None):
        self.widget = RemoteComponent(
            name=WIDGET_NAME,
            display_name=WIDGET_NAME,
            component_url=FILE_CHANNEL
        )

    def fetch(self):
        return [self.widget]
