import networkx as nx
from typing import Dict, Any, List, Tuple


class EvacuationRouter:
    def __init__(self):
        self.graph = nx.Graph()

    def build_network_from_geojson(self, geojson: Dict[str, Any]):
        # Mocking building network
        self.graph.add_node("settlement_a", elevation=100)
        self.graph.add_node("shelter_1", elevation=300)
        self.graph.add_edge("settlement_a", "shelter_1", length=5000, travel_time=30)

    def mark_flooded_edges(self, arrival_time_raster: Any, time_t: float):
        # Remove edges that are flooded at time_t
        pass

    def find_shortest_safe_route(
        self,
        origin: str,
        destinations: List[str],
        time_constraint: float,
    ) -> Tuple[List[str], float]:
        # Using Dijkstra's
        best_route = []
        best_time = float('inf')
        for dest in destinations:
            if not nx.has_path(self.graph, origin, dest):
                continue
            path = nx.shortest_path(self.graph, source=origin, target=dest, weight="travel_time")
            time = nx.shortest_path_length(self.graph, source=origin, target=dest, weight="travel_time")
            if time < time_constraint and time < best_time:
                best_route = path
                best_time = time

        return best_route, best_time

