import yaml
import sys
import backend

backend.CONFIG.update(yaml.load(open(sys.argv[1]), Loader=yaml.FullLoader))

print(backend.CONFIG[sys.argv[2]])


