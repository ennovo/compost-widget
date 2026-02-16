from pathlib import Path

from pydoover import config
from pydoover.cloud.processor import SubscriptionConfig


class EnnovoCompostWidgetConfig(config.Schema):
    def __init__(self):
        self.subscription = SubscriptionConfig(default="deployment_config")


def export():
    EnnovoCompostWidgetConfig().export(
        Path(__file__).parents[2] / "doover_config.json",
        "ennovo_compost_widget",
    )


if __name__ == "__main__":
    export()
