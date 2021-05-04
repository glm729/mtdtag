#!/usr/bin/env R


# Packages required
# -----------------------------------------------------------------------------


require(jsonlite)

# pkg <- c("jsonlite")
# for (p in pkg) {
#   if (!require(pkg, character.only = TRUE)) {
#     stop(paste0("Package `", p, "` is required"))
#   }
# }


# Function definitions
# -----------------------------------------------------------------------------


# Helper to get the reaction IDs (for naming in the JSON)
get_reac_ids <- function(d) {
  t <- d$entry[[1]]
  return(regmatches(t, regexpr("^(?<id>R\\d{5})", t, perl = TRUE))[[1]])
}

# Helper to get the left- and right-hand sides of the reaction equations
get_lr <- function(sp) {
  m <- regmatches(sp, gregexpr("(?<id>C\\d{5})", sp, perl = TRUE))
  return(list(l = m[[1]], r = m[[2]]))
}


# Operations
# -----------------------------------------------------------------------------


# Define paths
path <- list(
  ip = "./data/outArrange05Kegg.json",
  op = "./data/out_kegg_reactions.json"
)

# Read the data
data <- jsonlite::read_json(path$ip)

# Get the reaction IDs and the equations
reac_ids <- sapply(data, get_reac_ids)
equations <- sapply(data, function(d) d$equation[[1]])

# Split the equations
eqn_split <- strsplit(equations, ">")

# Get the opposing compounds and assign names
oppose <- lapply(eqn_split, get_lr)
names(oppose) <- reac_ids

# Write out
cat(paste0(jsonlite::toJSON(oppose, pretty = TRUE), "\n"), file = path$op)
