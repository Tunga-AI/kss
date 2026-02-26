# main.tf
# Terraform configuration for self-hosting LiveKit on Google Cloud Platform.

variable "project_id" { description = "GCP Project ID" }
variable "region"     { default = "us-central1" }
variable "zone"       { default = "us-central1-a" }

provider "google" {
  project = var.project_id
  region  = var.region
}

# 1. External Static IP for LiveKit
resource "google_compute_address" "livekit_ip" {
  name = "livekit-server-ip"
}

# 2. Firewall Rules for LiveKit
resource "google_compute_firewall" "livekit_firewall" {
  name    = "livekit-firewall"
  network = "default"

  # LiveKit API and Signal
  allow {
    protocol = "tcp"
    ports    = ["7880", "7881", "80", "443"]
  }

  # LiveKit RTC Media (UDP is critical for performance/scaling)
  allow {
    protocol = "udp"
    ports    = ["50000-60000"]
  }

  source_ranges = ["0.0.0.0/0"]
  target_tags   = ["livekit-server"]
}

# 3. Compute Engine Instance
resource "google_compute_instance" "livekit_instance" {
  name         = "livekit-server"
  machine_type = "e2-standard-4" # Sufficient for 200+ viewer rooms
  zone         = var.zone
  tags         = ["livekit-server"]

  boot_disk {
    initialize_params {
      image = "ubuntu-os-cloud/ubuntu-2204-lts"
      size  = 50
    }
  }

  network_interface {
    network = "default"
    access_config {
      nat_ip = google_compute_address.livekit_ip.address
    }
  }

  # Attach the startup script
  metadata_startup_script = file("startup-script.sh")

  metadata = {
    # You can pass variables to the script via metadata
    livekit_api_key    = "kss_api_key"
    livekit_api_secret = "kss_api_secret"
    domain             = "live.kss.ac.ke"
  }
}

output "livekit_external_ip" {
  value = google_compute_address.livekit_ip.address
}
