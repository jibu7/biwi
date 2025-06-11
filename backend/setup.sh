#!/bin/bash
poetry install
poetry run alembic upgrade head
