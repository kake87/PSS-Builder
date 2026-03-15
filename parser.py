import argparse
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
BACKEND_ROOT = ROOT / "backend"
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

from app.catalog_importer import (  # noqa: E402
    discover_hikvision_product_urls,
    import_hikvision_model_from_url,
    import_hikvision_models_from_category,
)


def main() -> int:
  parser = argparse.ArgumentParser(description="Hikvision parser utility")
  parser.add_argument("--url", help="Single product URL")
  parser.add_argument("--category-url", help="Category URL to discover and import all products")
  parser.add_argument("--type-key", default="camera", help="Catalog type key")
  parser.add_argument("--lifecycle", default="verified", help="Lifecycle status for imported models")
  parser.add_argument("--max-items", type=int, default=120, help="Max items for category mode")
  parser.add_argument("--discover-only", action="store_true", help="Only discover links in category mode")
  args = parser.parse_args()

  if not args.url and not args.category_url:
    parser.error("Provide either --url or --category-url")

  if args.url:
    model = import_hikvision_model_from_url(
      args.url,
      type_key=args.type_key,
      lifecycle_status=args.lifecycle,
    )
    print(json.dumps(model.model_dump(mode="json"), ensure_ascii=False, indent=2))
    return 0

  discovered = discover_hikvision_product_urls(args.category_url, max_items=args.max_items)
  if args.discover_only:
    print(json.dumps({"category_url": args.category_url, "discovered_urls": discovered}, ensure_ascii=False, indent=2))
    return 0

  models, errors, urls = import_hikvision_models_from_category(
    args.category_url,
    type_key=args.type_key,
    lifecycle_status=args.lifecycle,
    max_items=args.max_items,
  )
  print(
    json.dumps(
      {
        "category_url": args.category_url,
        "discovered_urls": len(urls),
        "imported_models": [item.model_dump(mode="json") for item in models],
        "failed": errors,
      },
      ensure_ascii=False,
      indent=2,
    )
  )
  return 0


if __name__ == "__main__":
  raise SystemExit(main())
