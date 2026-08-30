import os
import json
import csv
import zipfile
import shapefile
from typing import Any, Dict


class GISExporter:
    def __init__(self, output_dir: str = "/tmp"):
        self.output_dir = output_dir

    def export_geojson(self, data: Dict[str, Any], filename: str) -> str:
        filepath = os.path.join(self.output_dir, filename + ".geojson")
        with open(filepath, "w") as f:
            json.dump(data, f)
        return filepath

    def export_csv(self, data: list, filename: str) -> str:
        filepath = os.path.join(self.output_dir, filename + ".csv")
        if not data:
            return filepath
        with open(filepath, "w", newline="") as f:
            writer = csv.DictWriter(f, fieldnames=data[0].keys())
            writer.writeheader()
            writer.writerows(data)
        return filepath

    def export_shp(self, data: Dict[str, Any], filename: str) -> str:
        # Dummy shapefile export using pyshp
        filepath = os.path.join(self.output_dir, filename)
        w = shapefile.Writer(filepath)
        w.field("name", "C")
        w.record("dummy")
        w.point(1, 1)
        w.close()

        # Write .prj
        prj_content = (
            'GEOGCS["GCS_WGS_1984",DATUM["D_WGS_1984",'
            'SPHEROID["WGS_1984",6378137.0,298.257223563]],'
            'PRIMEM["Greenwich",0.0],UNIT["Degree",0.0174532925199433]]'
        )
        with open(filepath + ".prj", "w") as f:
            f.write(prj_content)

        # Zip them
        zip_path = filepath + ".zip"
        with zipfile.ZipFile(zip_path, "w") as zipf:
            for ext in [".shp", ".shx", ".dbf", ".prj"]:
                zipf.write(filepath + ext, filename + ext)
        return zip_path

    def export_kml(self, data: Dict[str, Any], filename: str) -> str:
        filepath = os.path.join(self.output_dir, filename + ".kml")
        kml_content = (
            "<?xml version='1.0' encoding='UTF-8'?>"
            "<kml xmlns='http://www.opengis.net/kml/2.2'><Document></Document></kml>"
        )
        with open(filepath, "w") as f:
            f.write(kml_content)
        return filepath

    def export_pdf(self, filename: str) -> str:
        filepath = os.path.join(self.output_dir, filename + ".pdf")
        from reportlab.pdfgen import canvas

        c = canvas.Canvas(filepath)
        c.drawString(100, 750, "HADR Situation Report with Scenario Assumptions")
        c.save()
        return filepath
