from pydoover.docker import run_app

from .application import EnnovoCompostWidgetApplication
from .app_config import EnnovoCompostWidgetConfig

def main():
    """
    Run the application.
    """
    run_app(EnnovoCompostWidgetApplication(config=EnnovoCompostWidgetConfig()))
