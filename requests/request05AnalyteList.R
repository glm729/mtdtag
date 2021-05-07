#!/usr/bin/env R


# Define paths to use for input and output
path <- list(
  ip = "../data/outRequest04AnalyteList.tsv",
  op = c("../data/outRequest05AnalyteList_", ".tsv"))

# Read the data, get the header, and get the data without the header
data.r <- readLines(path$ip)
header <- data.r[1]
data.m <- data.r[2:length(data.r)]

# Set the length per segment
length <- ceiling(length(data.m) / 3)

# Get the indices per segment
idx <- lapply(0:2, function(i) (1 + (length * i)):(length + (length * i)))

# If the final group is too long, truncate
if (max(idx[[length(idx)]]) > length(data.m)) {
  l <- idx[[length(idx)]]
  idx[[length(idx)]] <- l[which(l <= length(data.m))]
}

# Get the output in blocks
out <- lapply(idx, function(i) data.m[i])

# For each output block, prepare and write the file
for (i in seq_len(length(out))) {
  fname <- paste0(path$op[[1]], i, path$op[[2]])
  data.o <- paste0(paste0(c(header, out[[i]]), collapse = "\n"), "\n")
  cat(data.o, file = fname)
}
