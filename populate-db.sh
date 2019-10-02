#!/bin/bash
tar xzf db-dump.tar.gz
mongorestore dump
rm -rf dump
